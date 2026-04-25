import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from database import get_db
from models import (
    GenerateOffersRequest,
    GenerateOffersResponse,
    Offer,
    OfferActionRequest,
    OfferListResponse,
    OfferStatus,
    OfferStyle,
    MerchantCategory,
)
from services.offer_engine import generate_offers

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/offers", tags=["offers"])

_ACTION_TO_STATUS = {
    "accept": OfferStatus.ACCEPTED.value,
    "decline": OfferStatus.DECLINED.value,
    "dismiss": OfferStatus.DECLINED.value,
}


def _row_to_offer(row) -> Offer:
    return Offer(
        id=row["id"],
        merchant_id=row["merchant_id"],
        merchant_name=row["merchant_name"],
        merchant_category=MerchantCategory(row["merchant_category"]),
        headline=row["headline"],
        subtext=row["subtext"],
        description=row["description"],
        discount_value=row["discount_value"],
        discount_type=row["discount_type"],
        context_tags=json.loads(row["context_tags"] or "[]"),
        why_now=row["why_now"],
        created_at=row["created_at"],
        expires_at=row["expires_at"],
        style=OfferStyle(**json.loads(row["style"] or "{}")),
        status=OfferStatus(row["status"]),
        distance_meters=row["distance_meters"],
        redemption_token=row["redemption_token"],
    )


@router.post("/generate", response_model=GenerateOffersResponse)
async def generate_offers_endpoint(request: GenerateOffersRequest):
    try:
        return await generate_offers(request)
    except Exception:
        logger.exception("Offer generation failed")
        raise HTTPException(status_code=503, detail="Offer generation unavailable")


@router.get("", response_model=OfferListResponse)
async def list_offers(
    session_id: str = Query(...),
    status: Optional[str] = Query(None),
):
    db = await get_db()
    try:
        if status:
            cursor = await db.execute(
                "SELECT * FROM offers WHERE user_session_id = ? AND status = ? ORDER BY created_at DESC",
                (session_id, status),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM offers WHERE user_session_id = ? ORDER BY created_at DESC",
                (session_id,),
            )
        rows = await cursor.fetchall()
    finally:
        await db.close()

    return OfferListResponse(offers=[_row_to_offer(r) for r in rows])


@router.patch("/{offer_id}")
async def update_offer_status(offer_id: str, body: OfferActionRequest):
    new_status = _ACTION_TO_STATUS.get(body.action)
    if new_status is None:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{body.action}'. Valid actions: accept, decline, dismiss",
        )

    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM offers WHERE id = ?",
            (offer_id,),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Offer not found")
        if row["status"] != OfferStatus.ACTIVE.value:
            raise HTTPException(
                status_code=400,
                detail=f"Offer has already been {row['status']}",
            )

        await db.execute(
            "UPDATE offers SET status = ? WHERE id = ?",
            (new_status, offer_id),
        )
        await db.commit()

        cursor = await db.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
        updated_row = await cursor.fetchone()
    finally:
        await db.close()

    return {"offer": _row_to_offer(updated_row).model_dump(mode="json")}
