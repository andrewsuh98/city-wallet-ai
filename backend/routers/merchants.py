import json
from collections import Counter

from fastapi import APIRouter, HTTPException

from database import get_db
from models import Merchant, MerchantRule, MerchantListResponse, OfferAnalytics

router = APIRouter(prefix="/api/merchants", tags=["merchants"])


@router.get("", response_model=MerchantListResponse)
async def list_merchants():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM merchants ORDER BY name")
        rows = await cursor.fetchall()

        merchants = []
        for row in rows:
            # Fetch rules for each merchant
            rule_cursor = await db.execute(
                "SELECT * FROM merchant_rules WHERE merchant_id = ?",
                (row["id"],),
            )
            rule_rows = await rule_cursor.fetchall()

            rules = [
                MerchantRule(
                    id=r["id"],
                    merchant_id=r["merchant_id"],
                    max_discount_percent=r["max_discount_percent"],
                    min_discount_percent=r["min_discount_percent"],
                    active_hours_start=r["active_hours_start"],
                    active_hours_end=r["active_hours_end"],
                    trigger_conditions=json.loads(r["trigger_conditions"] or "[]"),
                    goal=r["goal"] or "",
                    max_offers_per_day=r["max_offers_per_day"],
                    offer_type=r["offer_type"] or "percentage_discount",
                    budget_daily_usd=r["budget_daily_usd"],
                )
                for r in rule_rows
            ]

            merchants.append(
                Merchant(
                    id=row["id"],
                    name=row["name"],
                    category=row["category"],
                    description=row["description"] or "",
                    latitude=row["latitude"],
                    longitude=row["longitude"],
                    address=row["address"] or "",
                    image_url=row["image_url"],
                    brand_voice=row["brand_voice"],
                    signature_items=json.loads(row["signature_items"] or "[]"),
                    target_demographics=json.loads(row["target_demographics"] or "[]"),
                    primary_goal=row["primary_goal"],
                    daily_budget_usd=row["daily_budget_usd"],
                    rules=rules,
                )
            )

        return MerchantListResponse(merchants=merchants)
    finally:
        await db.close()


@router.get("/{merchant_id}/analytics", response_model=OfferAnalytics)
async def merchant_analytics(merchant_id: str):
    db = await get_db()
    try:
        check = await db.execute("SELECT 1 FROM merchants WHERE id = ?", (merchant_id,))
        if await check.fetchone() is None:
            raise HTTPException(status_code=404, detail="Merchant not found")

        counts_cursor = await db.execute(
            """SELECT
                 COUNT(*) AS total_generated,
                 SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS total_accepted,
                 SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) AS total_declined,
                 SUM(CASE WHEN status = 'expired'  THEN 1 ELSE 0 END) AS total_expired,
                 SUM(CASE WHEN status = 'redeemed' THEN 1 ELSE 0 END) AS total_redeemed
               FROM offers WHERE merchant_id = ?""",
            (merchant_id,),
        )
        counts = await counts_cursor.fetchone()

        revenue_cursor = await db.execute(
            """SELECT COALESCE(SUM(r.cashback_amount), 0.0) AS revenue
               FROM redemptions r
               JOIN offers o ON o.id = r.offer_id
               WHERE o.merchant_id = ?""",
            (merchant_id,),
        )
        revenue_row = await revenue_cursor.fetchone()
        revenue_impact = float(revenue_row["revenue"] if revenue_row else 0.0)

        tags_cursor = await db.execute(
            "SELECT context_tags FROM offers WHERE merchant_id = ?",
            (merchant_id,),
        )
        tag_rows = await tags_cursor.fetchall()
        counter: Counter = Counter()
        for r in tag_rows:
            try:
                counter.update(json.loads(r["context_tags"] or "[]"))
            except (TypeError, ValueError):
                continue
        top_triggers = [tag for tag, _ in counter.most_common(5)]

        total_generated = int(counts["total_generated"] or 0) if counts else 0
        total_accepted = int(counts["total_accepted"] or 0) if counts else 0
        total_declined = int(counts["total_declined"] or 0) if counts else 0
        total_expired = int(counts["total_expired"] or 0) if counts else 0
        total_redeemed = int(counts["total_redeemed"] or 0) if counts else 0

        ever_accepted = total_accepted + total_redeemed
        acceptance_rate = ever_accepted / max(ever_accepted + total_declined, 1)
        redemption_rate = total_redeemed / max(ever_accepted, 1)

        return OfferAnalytics(
            merchant_id=merchant_id,
            total_generated=total_generated,
            total_accepted=total_accepted,
            total_declined=total_declined,
            total_expired=total_expired,
            total_redeemed=total_redeemed,
            acceptance_rate=round(acceptance_rate, 3),
            redemption_rate=round(redemption_rate, 3),
            top_context_triggers=top_triggers,
            revenue_impact_estimate=round(revenue_impact, 2),
        )
    finally:
        await db.close()
