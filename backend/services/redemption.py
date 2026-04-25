"""Redemption service: token generation, QR rendering, validation, commit, wallet."""

import base64
import io
import json
import logging
import re
import uuid
from datetime import datetime
from typing import Optional

import aiosqlite
import qrcode

from models import Offer, OfferStatus, OfferStyle, MerchantCategory


logger = logging.getLogger(__name__)

ASSUMED_ORDER_TOTAL_USD = 15.00


def generate_token() -> str:
    """Return a UUID v4 string suitable for QR encoding and paste fallback."""
    return str(uuid.uuid4())


def generate_qr_png_base64(token: str) -> str:
    """Render a QR encoding the token only (no host URL).

    The QR is intentionally token-only so the same QR works regardless of where
    the merchant scanner backend is hosted. The scanner extracts the raw token
    and calls its configured backend with it.
    """
    img = qrcode.make(token, box_size=10, border=2)
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def compute_cashback(
    discount_value: str,
    discount_type: str,
    order_total_usd: float = ASSUMED_ORDER_TOTAL_USD,
) -> float:
    """Convert a (value, type) pair to a dollar cashback estimate.

    Returns 0.0 for unknown types or unparseable strings rather than raising,
    so a redemption can still complete on malformed offer data.
    """
    if not discount_value:
        return 0.0
    try:
        if discount_type == "percentage_discount":
            match = re.search(r"(\d+(?:\.\d+)?)", discount_value)
            if not match:
                return 0.0
            pct = float(match.group(1)) / 100.0
            return round(order_total_usd * pct, 2)
        if discount_type == "fixed_amount":
            match = re.search(r"(\d+(?:\.\d+)?)", discount_value)
            if not match:
                return 0.0
            return round(float(match.group(1)), 2)
    except (ValueError, TypeError) as e:
        logger.warning("compute_cashback failed for %r/%r: %s", discount_value, discount_type, e)
    return 0.0


def _parse_expires_at(value) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _row_to_offer(row: aiosqlite.Row) -> Offer:
    """Hydrate an Offer from a SELECT * FROM offers row."""
    raw_style = row["style"]
    if isinstance(raw_style, str):
        style_dict = json.loads(raw_style) if raw_style else {}
    else:
        style_dict = raw_style or {}

    raw_tags = row["context_tags"]
    if isinstance(raw_tags, str):
        tags = json.loads(raw_tags) if raw_tags else []
    else:
        tags = raw_tags or []

    return Offer(
        id=row["id"],
        merchant_id=row["merchant_id"],
        merchant_name=row["merchant_name"],
        merchant_category=MerchantCategory(row["merchant_category"]),
        headline=row["headline"],
        subtext=row["subtext"],
        description=row["description"] or "",
        discount_value=row["discount_value"] or "",
        discount_type=row["discount_type"] or "",
        context_tags=tags,
        why_now=row["why_now"] or "",
        created_at=_parse_expires_at(row["created_at"]) or datetime.now(),
        expires_at=_parse_expires_at(row["expires_at"]) or datetime.now(),
        style=OfferStyle(**style_dict) if style_dict else OfferStyle(
            background_gradient=["#1A1A1A", "#1A1A1A"],
            emoji="*",
            tone="warm",
            headline_style="factual",
        ),
        status=OfferStatus(row["status"] or "active"),
        distance_meters=row["distance_meters"],
        redemption_token=row["redemption_token"],
    )


async def lookup_offer_by_token(
    db: aiosqlite.Connection, token: str
) -> Optional[Offer]:
    cursor = await db.execute(
        "SELECT * FROM offers WHERE redemption_token = ? LIMIT 1", (token,)
    )
    row = await cursor.fetchone()
    return _row_to_offer(row) if row else None


async def validate_redemption(
    db: aiosqlite.Connection,
    token: str,
    offer_id: Optional[str] = None,
) -> tuple[bool, Optional[Offer], str]:
    """Single source of truth for whether a token can be redeemed right now.

    Returns (is_valid, offer, reason). On expiry, also updates the offer's
    status to 'expired' so the next analytics call sees it correctly.
    """
    offer = await lookup_offer_by_token(db, token)
    if offer is None:
        return False, None, "Invalid token"

    if offer_id is not None and offer.id != offer_id:
        return False, None, "Token does not match offer"

    if offer.status == OfferStatus.REDEEMED:
        return False, offer, "Offer already redeemed"

    if offer.status != OfferStatus.ACCEPTED:
        return False, offer, f"Offer is not redeemable (status: {offer.status.value})"

    if offer.expires_at and offer.expires_at <= datetime.now():
        await db.execute(
            "UPDATE offers SET status = 'expired' WHERE id = ?", (offer.id,)
        )
        await db.commit()
        return False, offer, "Offer expired"

    return True, offer, "OK"


async def commit_redemption(
    db: aiosqlite.Connection, offer: Offer
) -> tuple[float, str]:
    """Insert redemption row and mark offer redeemed. Returns (cashback, redemption_id)."""
    cashback = compute_cashback(offer.discount_value, offer.discount_type)
    redemption_id = f"rdm_{uuid.uuid4().hex[:8]}"

    await db.execute(
        "INSERT INTO redemptions (id, offer_id, token, cashback_amount) VALUES (?, ?, ?, ?)",
        (redemption_id, offer.id, offer.redemption_token, cashback),
    )
    await db.execute(
        "UPDATE offers SET status = 'redeemed' WHERE id = ?", (offer.id,)
    )
    await db.commit()
    return cashback, redemption_id


async def get_wallet_balance(db: aiosqlite.Connection, session_id: str) -> float:
    cursor = await db.execute(
        """SELECT COALESCE(SUM(r.cashback_amount), 0.0) AS balance
           FROM redemptions r
           JOIN offers o ON o.id = r.offer_id
           WHERE o.user_session_id = ?""",
        (session_id,),
    )
    row = await cursor.fetchone()
    if row is None:
        return 0.0
    return round(float(row["balance"] or 0.0), 2)


async def list_session_redemptions(
    db: aiosqlite.Connection, session_id: str
) -> list[dict]:
    cursor = await db.execute(
        """SELECT r.id, r.offer_id, r.cashback_amount, r.redeemed_at,
                  o.merchant_name
           FROM redemptions r
           JOIN offers o ON o.id = r.offer_id
           WHERE o.user_session_id = ?
           ORDER BY r.redeemed_at DESC""",
        (session_id,),
    )
    rows = await cursor.fetchall()
    return [
        {
            "id": r["id"],
            "offer_id": r["offer_id"],
            "merchant_name": r["merchant_name"],
            "cashback_amount": float(r["cashback_amount"] or 0.0),
            "redeemed_at": str(r["redeemed_at"]),
        }
        for r in rows
    ]
