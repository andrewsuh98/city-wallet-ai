import json
import logging
import math
import uuid
from datetime import datetime, timedelta, timezone
from time import perf_counter
from typing import Optional

import anthropic

from config import ANTHROPIC_API_KEY, city_config
from database import get_db
from models import (
    ContextState,
    GenerateOffersRequest,
    GenerateOffersResponse,
    Merchant,
    MerchantCategory,
    MerchantRule,
    Offer,
    OfferStatus,
    OfferStyle,
    TransactionDensity,
)

logger = logging.getLogger(__name__)

_client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

_SYSTEM_PROMPT = """You are the City Wallet offer engine. You generate hyper-personalized,
context-aware offers for local merchants. Your job is to create offers
that feel crafted for this exact moment, not generic discounts.

OFFER RULES:
- Each offer must be understood in the first read
- Headline: max 8 words. Write as the city quietly noticing something for the user.
  Warm and inviting in all contexts — soft and ambient for calm/rain/cold, alive and energetic for sun/events/evening.
  Questions must be instantly readable. No distance in the headline — distance belongs in the subtext.
  No imperative fragments. No punchy single-word endings like "now".
- Subtext: max 15 words, include distance and the specific benefit
- Description: 2-3 sentences for the detail view
- Do not repeat headline structures across offers in the same batch

DISCOUNT RULES:
Scale the discount to how underutilized the merchant currently is:
- density < 0.5 (quiet): discount near the merchant's maximum — the need is urgent
- density 0.5-1.2 (normal): mid-range discount
- density > 1.2 (busy or surging): minimum discount — foot traffic needs no incentive
Always stay within the merchant's stated discount range.

TONE RULES:
Pick the right emotional register for the context, then find a fresh angle within it.
Do not default to the obvious execution — surprise is part of the value.
- rain / cold / grey: warmth, refuge, comfort
- hot / sunny: cool, refreshing, light
- quiet merchant: fleeting opportunity, "right now" urgency
- event nearby: energy, the crowd, the moment
- evening / night: wind-down, reward, treat yourself
- morning: fuel, start, momentum

STYLE RULES:
- background_gradient: two hex colors matching the offer's emotional tone
- tone: warm | urgent | playful | sophisticated
- headline_style: emotional — large, bold, feeling-first
- No emojis anywhere in the output — not in headlines, subtext, description, or why_now"""

_OFFER_SCHEMA = {
    "type": "object",
    "properties": {
        "offers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "merchant_id": {"type": "string"},
                    "headline": {"type": "string"},
                    "subtext": {"type": "string"},
                    "description": {"type": "string"},
                    "discount_value": {"type": "string"},
                    "discount_type": {
                        "type": "string",
                        "enum": ["percentage_discount", "fixed_amount", "free_item", "bogo"],
                    },
                    "why_now": {"type": "string"},
                    "expires_in_minutes": {"type": "integer"},
                    "style": {
                        "type": "object",
                        "properties": {
                            "background_gradient": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "tone": {
                                "type": "string",
                                "enum": ["warm", "urgent", "playful", "sophisticated"],
                            },
                            "headline_style": {
                                "type": "string",
                                "enum": ["emotional"],
                            },
                        },
                        "required": ["background_gradient", "tone", "headline_style"],
                        "additionalProperties": False,
                    },
                },
                "required": [
                    "merchant_id",
                    "headline",
                    "subtext",
                    "description",
                    "discount_value",
                    "discount_type",
                    "why_now",
                    "expires_in_minutes",
                    "style",
                ],
                "additionalProperties": False,
            },
        }
    },
    "required": ["offers"],
    "additionalProperties": False,
}


def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _urgency_label(score: float) -> str:
    if score < 0.25:
        return "low"
    if score < 0.5:
        return "moderate"
    if score < 0.75:
        return "high"
    return "critical"


def _clamp_discount(value_str: str, rule: MerchantRule) -> str:
    try:
        numeric = float("".join(c for c in value_str if c.isdigit() or c == "."))
        clamped = max(rule.min_discount_percent, min(rule.max_discount_percent, numeric))
        if "%" in value_str:
            return f"{int(clamped)}%"
        return f"${clamped:.0f} off"
    except (ValueError, TypeError):
        return f"{rule.min_discount_percent}%"


def _context_summary(context: ContextState) -> str:
    top_tags = ", ".join(context.context_tags[:3]) if context.context_tags else "none"
    return (
        f"{context.time_of_day} on {context.day_of_week}, "
        f"{context.weather.description}. "
        f"Tags: {top_tags}. "
        f"Urgency: {_urgency_label(context.urgency_score)}."
    )


async def match_merchants(
    context: ContextState,
    db,
) -> list[tuple[Merchant, MerchantRule, Optional[TransactionDensity]]]:
    radius = city_config.get("default_radius_meters", 1000)
    user_lat = context.location.latitude
    user_lng = context.location.longitude
    now_hhmm = context.timestamp.strftime("%H:%M")

    cursor = await db.execute("SELECT * FROM merchants")
    merchant_rows = await cursor.fetchall()

    cursor = await db.execute("SELECT * FROM merchant_rules")
    rule_rows = await cursor.fetchall()

    cursor = await db.execute(
        """
        SELECT merchant_id, COUNT(*) as cnt
        FROM offers
        WHERE DATE(created_at) = DATE('now')
        GROUP BY merchant_id
        """
    )
    count_rows = await cursor.fetchall()
    today_counts: dict[str, int] = {r["merchant_id"]: r["cnt"] for r in count_rows}

    rules_by_merchant: dict[str, list[MerchantRule]] = {}
    for r in rule_rows:
        rule = MerchantRule(
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
        rules_by_merchant.setdefault(r["merchant_id"], []).append(rule)

    density_map: dict[str, TransactionDensity] = {
        d.merchant_id: d for d in context.merchant_densities
    }

    context_tag_set = set(context.context_tags)
    matched: list[tuple[Merchant, MerchantRule, Optional[TransactionDensity]]] = []

    for row in merchant_rows:
        merchant_id = row["id"]

        distance = _haversine_meters(user_lat, user_lng, row["latitude"], row["longitude"])
        if distance > radius:
            continue

        for rule in rules_by_merchant.get(merchant_id, []):
            if not (rule.active_hours_start <= now_hhmm <= rule.active_hours_end):
                continue
            if rule.trigger_conditions and not (set(rule.trigger_conditions) & context_tag_set):
                continue
            if today_counts.get(merchant_id, 0) >= rule.max_offers_per_day:
                continue

            merchant = Merchant(
                id=merchant_id,
                name=row["name"],
                category=row["category"],
                description=row["description"] or "",
                latitude=row["latitude"],
                longitude=row["longitude"],
                address=row["address"] or "",
                image_url=row["image_url"],
                rules=[rule],
            )
            matched.append((merchant, rule, density_map.get(merchant_id)))
            break

        if len(matched) >= 8:
            break

    return matched


def _build_prompt(
    context: ContextState,
    merchant_rules: list[tuple[Merchant, MerchantRule, Optional[TransactionDensity]]],
    user_preferences: dict,
) -> str:
    user_lat = context.location.latitude
    user_lng = context.location.longitude

    event_names = (
        ", ".join(e.name for e in context.nearby_events) if context.nearby_events else "none"
    )
    tags_str = ", ".join(context.context_tags) if context.context_tags else "none"
    urgency = f"{context.urgency_score:.2f} — {_urgency_label(context.urgency_score)}"

    lines = [
        "CURRENT CONTEXT:",
        f"- Weather: {context.weather.description}, {context.weather.temp_celsius}C, humidity {context.weather.humidity}%",
        f"- Time: {context.day_of_week} {context.time_of_day} ({context.timestamp.strftime('%H:%M')})",
        f"- Context tags: {tags_str}",
        f"- Nearby events: {event_names}",
        f"- Urgency: {urgency}",
    ]

    intent_tags = (user_preferences or {}).get("intent_tags", [])
    if intent_tags:
        lines.append(f"\nUSER INTENT SIGNALS (soft hint only): {', '.join(intent_tags)}")

    lines.append("\nELIGIBLE MERCHANTS — generate one offer per merchant:")

    for i, (merchant, rule, density) in enumerate(merchant_rules, 1):
        distance = _haversine_meters(user_lat, user_lng, merchant.latitude, merchant.longitude)

        if density:
            traffic = (
                f"{density.trend} (ratio {density.density_ratio:.2f} — "
                f"normally {density.avg_hour_txns:.0f} txns/hr, now {density.current_hour_txns})"
            )
        else:
            traffic = "unknown"

        lines += [
            f"\n{i}. {merchant.name} ({merchant.category})",
            f"   Distance: {distance:.0f}m",
            f"   Traffic: {traffic}",
            f'   Goal: "{rule.goal}"',
            f"   Discount range: {rule.min_discount_percent}–{rule.max_discount_percent}% ({rule.offer_type})",
            f'   merchant_id: "{merchant.id}"',
        ]

    return "\n".join(lines)


async def call_claude(user_prompt: str) -> dict:
    response = await _client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=2000,
        temperature=0.8,
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_prompt}],
        output_config={"format": {"type": "json_schema", "schema": _OFFER_SCHEMA}},
        timeout=5.0,
    )
    return json.loads(response.content[0].text)


async def process_response(
    raw: dict,
    merchant_rules: list[tuple[Merchant, MerchantRule, Optional[TransactionDensity]]],
    context: ContextState,
    session_id: str,
    db,
) -> list[Offer]:
    user_lat = context.location.latitude
    user_lng = context.location.longitude
    now = datetime.now(timezone.utc)

    merchant_lookup: dict[str, tuple[Merchant, MerchantRule]] = {
        m.id: (m, r) for m, r, _ in merchant_rules
    }

    offers: list[Offer] = []
    rows_to_insert: list[tuple] = []

    for item in raw.get("offers", []):
        merchant_id = item.get("merchant_id", "")
        if merchant_id not in merchant_lookup:
            logger.warning(
                "Claude returned unknown merchant_id",
                extra={"merchant_id": merchant_id},
            )
            continue

        merchant, rule = merchant_lookup[merchant_id]
        discount_value = _clamp_discount(item["discount_value"], rule)
        expires_minutes = max(15, min(60, item["expires_in_minutes"]))
        expires_at = now + timedelta(minutes=expires_minutes)
        distance = _haversine_meters(user_lat, user_lng, merchant.latitude, merchant.longitude)
        offer_id = "off_" + uuid.uuid4().hex

        style = OfferStyle(
            background_gradient=item["style"]["background_gradient"],
            tone=item["style"]["tone"],
            headline_style=item["style"]["headline_style"],
        )

        offer = Offer(
            id=offer_id,
            merchant_id=merchant_id,
            merchant_name=merchant.name,
            merchant_category=MerchantCategory(merchant.category),
            headline=item["headline"],
            subtext=item["subtext"],
            description=item["description"],
            discount_value=discount_value,
            discount_type=item["discount_type"],
            context_tags=context.context_tags,
            why_now=item["why_now"],
            created_at=now,
            expires_at=expires_at,
            style=style,
            status=OfferStatus.ACTIVE,
            distance_meters=round(distance, 1),
            redemption_token=None,
        )
        offers.append(offer)

        rows_to_insert.append((
            offer_id,
            merchant_id,
            merchant.name,
            merchant.category,
            offer.headline,
            offer.subtext,
            offer.description,
            discount_value,
            offer.discount_type,
            json.dumps(context.context_tags),
            offer.why_now,
            json.dumps(offer.style.model_dump()),
            OfferStatus.ACTIVE.value,
            round(distance, 1),
            now.isoformat(),
            expires_at.isoformat(),
            session_id,
        ))

    if rows_to_insert:
        await db.executemany(
            """
            INSERT INTO offers (
                id, merchant_id, merchant_name, merchant_category,
                headline, subtext, description, discount_value, discount_type,
                context_tags, why_now, style, status, distance_meters,
                created_at, expires_at, user_session_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows_to_insert,
        )
        await db.commit()

    return offers


async def generate_offers(request: GenerateOffersRequest) -> GenerateOffersResponse:
    from services.slm import get_user_preferences

    start = perf_counter()
    db = await get_db()

    try:
        user_preferences = await get_user_preferences(
            request.session_id, request.context.context_tags
        )

        merchant_rules = await match_merchants(request.context, db)

        if not merchant_rules:
            return GenerateOffersResponse(
                offers=[],
                generation_time_ms=int((perf_counter() - start) * 1000),
                context_summary=_context_summary(request.context),
            )

        user_prompt = _build_prompt(request.context, merchant_rules, user_preferences)
        raw = await call_claude(user_prompt)
        offers = await process_response(raw, merchant_rules, request.context, request.session_id, db)

    finally:
        await db.close()

    return GenerateOffersResponse(
        offers=offers,
        generation_time_ms=int((perf_counter() - start) * 1000),
        context_summary=_context_summary(request.context),
    )
