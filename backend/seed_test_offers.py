"""Seed accepted offers with redemption tokens for end-to-end testing.

Usage (run from backend/):
    python seed_test_offers.py <session_id> [count]

Creates `count` offers (default 3), one per merchant, all in 'accepted' state
with a fresh UUID redemption token and a 30-minute expiry. Prints each
offer/token pair so you can paste into the merchant scanner without bouncing
through the wallet page.
"""

import asyncio
import json
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone

from database import get_db, init_db
from services.redemption import generate_token


SAMPLE_TAGS = ["rainy", "afternoon", "quiet_period", "cold", "weekend"]
SAMPLE_GRADIENTS = [
    ["#4A2C2A", "#D4A574"],
    ["#1E3A8A", "#3B82F6"],
    ["#7C2D12", "#F97316"],
    ["#14532D", "#22C55E"],
    ["#581C87", "#A855F7"],
]


async def seed_test_offers(session_id: str, count: int = 3):
    await init_db()
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, name, category FROM merchants ORDER BY id LIMIT ?", (count,)
        )
        merchants = list(await cursor.fetchall())
        if not merchants:
            print("No merchants in DB. Run `python seed.py` first.")
            return

        print(f"Seeding {len(merchants)} accepted offers for session_id={session_id}")
        print("-" * 76)

        for i, m in enumerate(merchants):
            offer_id = f"off_{uuid.uuid4().hex[:8]}"
            token = generate_token()
            gradient = SAMPLE_GRADIENTS[i % len(SAMPLE_GRADIENTS)]
            style = {
                "background_gradient": gradient,
                "tone": "warm",
                "headline_style": "emotional",
            }
            tags = random.sample(SAMPLE_TAGS, 3)
            expires_at = (
                datetime.now(timezone.utc) + timedelta(minutes=30)
            ).isoformat()

            await db.execute(
                """INSERT INTO offers (
                    id, merchant_id, merchant_name, merchant_category,
                    headline, subtext, description, discount_value, discount_type,
                    context_tags, why_now, style, status, distance_meters,
                    expires_at, redemption_token, user_session_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', ?, ?, ?, ?)""",
                (
                    offer_id,
                    m["id"],
                    m["name"],
                    m["category"],
                    f"15% off at {m['name']}",
                    "Quiet afternoon, 2 min walk",
                    "Seeded offer for end-to-end testing.",
                    "15%",
                    "percentage_discount",
                    json.dumps(tags),
                    "Seeded for demo flow",
                    json.dumps(style),
                    random.randint(50, 500),
                    expires_at,
                    token,
                    session_id,
                ),
            )
            print(f"OFFER {offer_id}  TOKEN {token}  MERCHANT {m['name']}")

        await db.commit()
        print("-" * 76)
        print("Done. Visit /wallet on the frontend to see the offers.")
    finally:
        await db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python seed_test_offers.py <session_id> [count]")
        sys.exit(1)
    sid = sys.argv[1]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    asyncio.run(seed_test_offers(sid, n))
