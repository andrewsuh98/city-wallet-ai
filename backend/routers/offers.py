import asyncio
import json
import logging

import anthropic
from fastapi import APIRouter, HTTPException, Query

from database import get_db
from models import (
    GenerateOffersRequest,
    GenerateOffersResponse,
    OfferActionRequest,
    OfferListResponse,
    OfferStatus,
)
from services import redemption as svc
from services.offer_engine import generate_offers

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/offers", tags=["offers"])

_ACTION_TO_STATUS = {
    "accept": OfferStatus.ACCEPTED.value,
    "decline": OfferStatus.DECLINED.value,
    "dismiss": OfferStatus.DECLINED.value,
}


@router.post("/generate", response_model=GenerateOffersResponse)
async def generate_offers_endpoint(request: GenerateOffersRequest):
    try:
        return await generate_offers(request)
    except (anthropic.APIError, asyncio.TimeoutError, json.JSONDecodeError):
        logger.exception("Offer generation failed")
        raise HTTPException(status_code=503, detail="Offer generation unavailable")


@router.get("", response_model=OfferListResponse)
async def list_offers(
    session_id: str = Query(...),
    status: OfferStatus | None = Query(None),
):
    db = await get_db()
    try:
        if status is not None:
            cursor = await db.execute(
                "SELECT * FROM offers WHERE user_session_id = ? AND status = ? ORDER BY created_at DESC",
                (session_id, status.value),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM offers WHERE user_session_id = ? ORDER BY created_at DESC",
                (session_id,),
            )
        rows = await cursor.fetchall()
    finally:
        await db.close()

    return OfferListResponse(offers=[svc._row_to_offer(r) for r in rows])


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

        if body.action == "accept":
            new_token = svc.generate_token()
            await db.execute(
                "UPDATE offers SET status = ?, redemption_token = ? WHERE id = ?",
                (new_status, new_token, offer_id),
            )
        else:
            await db.execute(
                "UPDATE offers SET status = ? WHERE id = ?",
                (new_status, offer_id),
            )
        await db.commit()

        cursor = await db.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
        updated_row = await cursor.fetchone()
    finally:
        await db.close()

    return {"offer": svc._row_to_offer(updated_row).model_dump(mode="json")}
