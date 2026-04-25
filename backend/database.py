import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "city_wallet.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT,
    image_url TEXT,
    brand_voice TEXT,
    signature_items TEXT,
    target_demographics TEXT,
    primary_goal TEXT,
    daily_budget_usd REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_rules (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id),
    max_discount_percent INTEGER DEFAULT 20,
    min_discount_percent INTEGER DEFAULT 5,
    active_hours_start TEXT DEFAULT '00:00',
    active_hours_end TEXT DEFAULT '23:59',
    trigger_conditions TEXT,
    goal TEXT,
    max_offers_per_day INTEGER DEFAULT 10,
    offer_type TEXT DEFAULT 'percentage_discount',
    budget_daily_usd REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id),
    merchant_name TEXT NOT NULL,
    merchant_category TEXT NOT NULL,
    headline TEXT NOT NULL,
    subtext TEXT NOT NULL,
    description TEXT,
    discount_value TEXT,
    discount_type TEXT,
    context_tags TEXT,
    why_now TEXT,
    style TEXT,
    status TEXT DEFAULT 'active',
    distance_meters REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    redemption_token TEXT,
    user_session_id TEXT
);

CREATE TABLE IF NOT EXISTS redemptions (
    id TEXT PRIMARY KEY,
    offer_id TEXT NOT NULL REFERENCES offers(id),
    token TEXT NOT NULL,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cashback_amount REAL
);

CREATE INDEX IF NOT EXISTS idx_offers_session ON offers(user_session_id);
CREATE INDEX IF NOT EXISTS idx_offers_merchant ON offers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_token ON redemptions(token);
"""


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


MERCHANT_PROFILE_COLUMNS = [
    ("brand_voice", "TEXT"),
    ("signature_items", "TEXT"),
    ("target_demographics", "TEXT"),
    ("primary_goal", "TEXT"),
    ("daily_budget_usd", "REAL"),
]


async def _migrate_merchant_profile(db: aiosqlite.Connection) -> None:
    """Idempotently add merchant onboarding columns to existing databases."""
    cursor = await db.execute("PRAGMA table_info(merchants)")
    rows = await cursor.fetchall()
    existing = {r["name"] for r in rows}
    for name, col_type in MERCHANT_PROFILE_COLUMNS:
        if name not in existing:
            await db.execute(f"ALTER TABLE merchants ADD COLUMN {name} {col_type}")


async def init_db():
    db = await get_db()
    try:
        await db.executescript(SCHEMA)
        await _migrate_merchant_profile(db)
        await db.commit()
    finally:
        await db.close()
