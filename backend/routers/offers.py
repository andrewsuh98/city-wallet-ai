"""Offers router (stub).

This stub provides the minimum surface needed for the redemption flow:
list offers for a session and update offer state (accept/decline/dismiss).
The offer-engine teammate will extend it with /generate and richer logic.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException

from database import get_db
from models import OfferActionRequest
from services import redemption as svc


router = APIRouter(prefix="/api/offers", tags=["offers"])


VALID_ACTIONS = {"accept", "decline", "dismiss"}


@router.get("")
async def list_offers(session_id: str, status: Optional[str] = None):
    db = await get_db()
    try:
        if status:
            cursor = await db.execute(
                """SELECT * FROM offers
                   WHERE user_session_id = ? AND status = ?
                   ORDER BY created_at DESC""",
                (session_id, status),
            )
        else:
            cursor = await db.execute(
                """SELECT * FROM offers
                   WHERE user_session_id = ?
                   ORDER BY created_at DESC""",
                (session_id,),
            )
        rows = await cursor.fetchall()
        offers = [svc._row_to_offer(r) for r in rows]
        return {"offers": offers}
    finally:
        await db.close()


@router.patch("/{offer_id}")
async def update_offer(offer_id: str, req: OfferActionRequest):
    if req.action not in VALID_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"action must be one of {sorted(VALID_ACTIONS)}",
        )

    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
        row = await cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Offer not found")

        current_status = row["status"]
        if current_status != "active":
            raise HTTPException(
                status_code=400,
                detail=f"Offer no longer actionable (status: {current_status})",
            )

        if req.action == "accept":
            token = svc.generate_token()
            await db.execute(
                "UPDATE offers SET status = 'accepted', redemption_token = ? WHERE id = ?",
                (token, offer_id),
            )
        else:
            await db.execute(
                "UPDATE offers SET status = 'declined' WHERE id = ?", (offer_id,)
            )
        await db.commit()

        cursor = await db.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
        latest = await cursor.fetchone()
        if latest is None:
            raise HTTPException(status_code=500, detail="Offer disappeared after update")
        return {"offer": svc._row_to_offer(latest)}
    finally:
        await db.close()
