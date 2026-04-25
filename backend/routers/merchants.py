import json
from fastapi import APIRouter
from database import get_db
from models import Merchant, MerchantRule, MerchantListResponse

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
