"""Seed the database with merchants and rules from the city config."""

import asyncio
import json
import uuid

from config import city_config
from database import init_db, get_db


async def seed():
    await init_db()
    db = await get_db()

    try:
        # Clear existing data
        await db.execute("DELETE FROM merchant_rules")
        await db.execute("DELETE FROM merchants")

        merchants = city_config.get("merchants", [])

        for m in merchants:
            await db.execute(
                """INSERT INTO merchants (id, name, category, description, latitude, longitude, address, image_url)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    m["id"],
                    m["name"],
                    m["category"],
                    m.get("description", ""),
                    m["latitude"],
                    m["longitude"],
                    m.get("address", ""),
                    m.get("image_url"),
                ),
            )

            for rule in m.get("rules", []):
                rule_id = f"r_{uuid.uuid4().hex[:8]}"
                await db.execute(
                    """INSERT INTO merchant_rules
                       (id, merchant_id, max_discount_percent, min_discount_percent,
                        active_hours_start, active_hours_end, trigger_conditions,
                        goal, max_offers_per_day, offer_type, budget_daily_usd)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        rule_id,
                        m["id"],
                        rule.get("max_discount_percent", 20),
                        rule.get("min_discount_percent", 5),
                        rule.get("active_hours_start", "00:00"),
                        rule.get("active_hours_end", "23:59"),
                        json.dumps(rule.get("trigger_conditions", [])),
                        rule.get("goal", ""),
                        rule.get("max_offers_per_day", 10),
                        rule.get("offer_type", "percentage_discount"),
                        rule.get("budget_daily_usd"),
                    ),
                )

        await db.commit()
        print(f"Seeded {len(merchants)} merchants with their rules.")
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed())
