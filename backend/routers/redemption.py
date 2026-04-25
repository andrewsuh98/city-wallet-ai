"""Redemption endpoints: QR fetch, validate, redeem, wallet."""

from fastapi import APIRouter, HTTPException

from database import get_db
from models import (
    Offer,
    RedemptionRequest,
    RedemptionResult,
    TokenValidationResponse,
)
from services import redemption as svc


router = APIRouter(prefix="/api", tags=["redemption"])


@router.get("/redeem/qr/{offer_id}")
async def get_offer_qr(offer_id: str):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
        row = await cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Offer not found")
        offer = svc._row_to_offer(row)
        if offer.status.value != "accepted" or not offer.redemption_token:
            raise HTTPException(
                status_code=400,
                detail=f"Offer not in accepted state (status: {offer.status.value})",
            )
        qr_b64 = svc.generate_qr_png_base64(offer.redemption_token)
        return {
            "qr_base64": qr_b64,
            "token": offer.redemption_token,
            "expires_at": offer.expires_at.isoformat(),
        }
    finally:
        await db.close()


@router.get("/redeem/validate/{token}", response_model=TokenValidationResponse)
async def validate(token: str):
    db = await get_db()
    try:
        is_valid, offer, _reason = await svc.validate_redemption(db, token)
        if not is_valid or offer is None:
            return TokenValidationResponse(valid=False, offer=None, merchant_name=None)
        return TokenValidationResponse(
            valid=True, offer=offer, merchant_name=offer.merchant_name
        )
    finally:
        await db.close()


@router.post("/redeem", response_model=RedemptionResult)
async def redeem(req: RedemptionRequest):
    db = await get_db()
    try:
        is_valid, offer, reason = await svc.validate_redemption(
            db, req.token, offer_id=req.offer_id
        )
        if not is_valid or offer is None:
            return RedemptionResult(
                success=False, offer=offer, message=reason, cashback_amount=None
            )

        cashback, _redemption_id = await svc.commit_redemption(db, offer)

        cursor = await db.execute("SELECT * FROM offers WHERE id = ?", (offer.id,))
        latest_row = await cursor.fetchone()
        latest_offer: Offer = svc._row_to_offer(latest_row) if latest_row else offer

        message = (
            f"Redeemed at {latest_offer.merchant_name}. ${cashback:.2f} cashback applied."
        )
        return RedemptionResult(
            success=True, offer=latest_offer, message=message, cashback_amount=cashback
        )
    finally:
        await db.close()


@router.get("/wallet/{session_id}")
async def get_wallet(session_id: str):
    db = await get_db()
    try:
        balance = await svc.get_wallet_balance(db, session_id)
        redemptions = await svc.list_session_redemptions(db, session_id)
        return {
            "balance_usd": balance,
            "redemption_count": len(redemptions),
            "redemptions": redemptions,
        }
    finally:
        await db.close()
