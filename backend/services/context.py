"""Context orchestrator.

compose_context() is the single entry point used by the router. It runs
the signal sources in parallel, derives semantic tags, and scores urgency.
"""

import asyncio
import math
from datetime import datetime, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

from config import city_config
from models import (
    ContextState,
    EventData,
    TransactionDensity,
    UserLocation,
    WeatherCondition,
    WeatherData,
)
from services import events as events_service
from services import payone, weather as weather_service


# --- time classification ---

def classify_time(hour: int) -> str:
    if 5 <= hour < 8:
        return "early_morning"
    if 8 <= hour < 11:
        return "morning"
    if 11 <= hour < 14:
        return "lunch"
    if 14 <= hour < 17:
        return "afternoon"
    if 17 <= hour < 21:
        return "evening"
    return "night"


# --- haversine for distance filter ---

def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6_371_000.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _filter_nearby(merchants: list[dict], lat: float, lng: float, radius: float) -> list[dict]:
    return [
        m for m in merchants
        if _haversine_meters(lat, lng, m["latitude"], m["longitude"]) <= radius
    ]


# --- tag derivation ---

def derive_context_tags(
    weather: WeatherData,
    time_of_day: str,
    is_weekend: bool,
    events: list[EventData],
    densities: list[TransactionDensity],
    merchant_lookup: dict[str, dict],
) -> list[str]:
    rules = city_config["context_tag_rules"]
    cold = rules["cold_threshold_celsius"]
    hot = rules["hot_threshold_celsius"]
    quiet_thr = rules["quiet_density_ratio"]
    busy_thr = rules["busy_density_ratio"]

    tags: list[str] = []

    # weather
    if weather.temp_celsius < cold:
        tags.append("cold")
    if weather.temp_celsius > hot:
        tags.append("hot")
    if weather.condition in (WeatherCondition.RAIN, WeatherCondition.STORM):
        tags.append("rainy")
    if weather.condition == WeatherCondition.SNOW:
        tags.append("snowy")
    if weather.condition == WeatherCondition.CLEAR:
        tags.append("clear_sky")

    # time
    tags.append(time_of_day if time_of_day != "lunch" else "lunch_hour")
    tags.append("weekend" if is_weekend else "weekday")

    # events
    if events:
        tags.append("event_nearby")

    # densities
    if any(d.density_ratio < quiet_thr for d in densities):
        tags.append("quiet_period")
    if densities:
        avg_ratio = sum(d.density_ratio for d in densities) / len(densities)
        if avg_ratio > busy_thr:
            tags.append("busy_area")

    quiet_by_category: dict[str, bool] = {}
    for d in densities:
        if d.trend != "quiet":
            continue
        merchant = merchant_lookup.get(d.merchant_id)
        if not merchant:
            continue
        quiet_by_category[merchant["category"]] = True

    if quiet_by_category.get("cafe"):
        tags.append("quiet_cafes")
    if quiet_by_category.get("restaurant"):
        tags.append("quiet_restaurants")

    # de-dupe while preserving order
    seen = set()
    return [t for t in tags if not (t in seen or seen.add(t))]


# --- urgency ---

def compute_urgency(tags: list[str]) -> float:
    score = 0.3  # baseline
    if "rainy" in tags or "snowy" in tags:
        score += 0.20
    if "lunch_hour" in tags:
        score += 0.15
    if "quiet_period" in tags:
        score += 0.15
    if "event_nearby" in tags:
        score += 0.10
    if "cold" in tags:
        score += 0.10
    if "weekend" in tags and "afternoon" in tags:
        score -= 0.10
    if "clear_sky" in tags:
        score -= 0.05
    return max(0.0, min(1.0, round(score, 2)))


# --- demo overrides ---

DEMO_PRESETS = {
    "rainy_afternoon": {
        "weather": WeatherData(
            condition=WeatherCondition.RAIN,
            temp_celsius=11.0,
            humidity=85,
            description="light rain (demo)",
        ),
        "weekday": 1,   # Tuesday
        "hour": 14,
        "minute": 30,
    },
    "hot_weekend": {
        "weather": WeatherData(
            condition=WeatherCondition.CLEAR,
            temp_celsius=32.0,
            humidity=40,
            description="sunny (demo)",
        ),
        "weekday": 5,   # Saturday
        "hour": 12,
        "minute": 0,
    },
    "event_night": {
        "weather": WeatherData(
            condition=WeatherCondition.CLOUDY,
            temp_celsius=18.0,
            humidity=65,
            description="overcast (demo)",
        ),
        "weekday": 4,   # Friday
        "hour": 19,
        "minute": 0,
    },
}


def _demo_now(preset: dict, tz: ZoneInfo) -> datetime:
    """Anchor demo time on today, then shift to the preset's weekday."""
    today = datetime.now(tz).replace(
        hour=preset["hour"], minute=preset["minute"], second=0, microsecond=0
    )
    delta = (preset["weekday"] - today.weekday()) % 7
    return today + timedelta(days=delta)


# --- main orchestrator ---

async def compose_context(
    lat: float,
    lng: float,
    accuracy_meters: Optional[float] = None,
    demo_mode: Optional[str] = None,
) -> ContextState:
    tz = ZoneInfo(city_config.get("timezone", "UTC"))
    preset = DEMO_PRESETS.get(demo_mode) if demo_mode else None

    if preset:
        now = _demo_now(preset, tz)
        weather = preset["weather"]
        # Make the cached weather match so any subsequent caller sees demo state.
        weather_service.override_cache(weather)
        events_task = events_service.get_nearby_events(lat, lng, now=now)
        events = await events_task
    else:
        now = datetime.now(tz)
        weather, events = await asyncio.gather(
            weather_service.get_weather(),
            events_service.get_nearby_events(lat, lng, now=now),
        )

    time_of_day = classify_time(now.hour)
    day_of_week = now.strftime("%A").lower()
    is_weekend = day_of_week in ("saturday", "sunday")

    radius = city_config.get("default_radius_meters", 1000)
    nearby_merchants = _filter_nearby(payone.get_merchant_configs(), lat, lng, radius)
    densities = payone.simulate_for_merchants(nearby_merchants, now.hour, weather, is_weekend)
    live_signals = payone.simulate_live_signals_for(nearby_merchants, densities, now.hour)

    merchant_lookup = {m["id"]: m for m in nearby_merchants}
    tags = derive_context_tags(
        weather, time_of_day, is_weekend, events, densities, merchant_lookup
    )
    urgency = compute_urgency(tags)

    return ContextState(
        timestamp=now,
        location=UserLocation(latitude=lat, longitude=lng, accuracy_meters=accuracy_meters),
        weather=weather,
        time_of_day=time_of_day,
        day_of_week=day_of_week,
        is_weekend=is_weekend,
        nearby_events=events,
        merchant_densities=densities,
        merchant_live_signals=live_signals,
        context_tags=tags,
        urgency_score=urgency,
    )
