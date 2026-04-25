"""Simulated Payone transaction density.

Payone is a real DSV asset; we don't have API access, so we simulate
realistic per-merchant traffic from patterns in the city config.
Replace this module with a real client when access is available — the
public surface is just `simulate_density` and `simulate_for_merchants`.
"""

import random

from config import city_config
from models import MerchantLiveSignal, TransactionDensity, WeatherCondition, WeatherData


def _trend(density_ratio: float) -> str:
    if density_ratio < 0.5:
        return "quiet"
    if density_ratio < 1.2:
        return "normal"
    if density_ratio < 1.8:
        return "busy"
    return "surging"


def simulate_density(
    merchant_config: dict,
    current_hour: int,
    weather: WeatherData,
    is_weekend: bool,
) -> TransactionDensity:
    pattern = merchant_config.get("transaction_pattern", {})
    base = float(pattern.get("avg_hourly_txns", 20))

    if current_hour in pattern.get("peak_hours", []):
        hour_mod = 1.5
    elif current_hour in pattern.get("quiet_hours", []):
        hour_mod = 0.4
    else:
        hour_mod = 1.0

    rainy = weather.condition in (WeatherCondition.RAIN, WeatherCondition.STORM)
    weather_mod = 0.7 if rainy else 1.0

    weekend_mod = pattern.get("weekend_modifier", 1.0) if is_weekend else 1.0

    # Seeded RNG: same (merchant, hour, weather, weekend) -> same density across
    # consecutive calls. Keeps consecutive /api/context responses stable.
    rng = random.Random(
        hash((merchant_config["id"], current_hour, weather.condition.value, is_weekend))
    )
    noise = rng.gauss(0, 0.15)

    current_txns = int(base * hour_mod * weather_mod * weekend_mod * (1 + noise))
    current_txns = max(0, current_txns)
    density_ratio = current_txns / base if base > 0 else 1.0

    return TransactionDensity(
        merchant_id=merchant_config["id"],
        current_hour_txns=current_txns,
        avg_hour_txns=base,
        density_ratio=round(density_ratio, 2),
        trend=_trend(density_ratio),
    )


def simulate_for_merchants(
    merchants: list[dict],
    current_hour: int,
    weather: WeatherData,
    is_weekend: bool,
) -> list[TransactionDensity]:
    return [simulate_density(m, current_hour, weather, is_weekend) for m in merchants]


def _staff_capacity(density_ratio: float) -> str:
    if density_ratio < 0.6:
        return "high"
    if density_ratio > 1.4:
        return "low"
    return "normal"


def _inventory_flags(merchant_config: dict, current_hour: int, density_ratio: float) -> list[str]:
    """Heuristic inventory state from merchant config + current load.

    Real Payone integration would replace this with live POS feed.
    """
    flags: list[str] = []
    pattern = merchant_config.get("transaction_pattern", {})
    signature = merchant_config.get("signature_items", [])
    if not signature:
        return flags

    # Right after a quiet hour, surface a "fresh batch" hook on the first signature item
    just_after_quiet = (current_hour - 1) in pattern.get("quiet_hours", [])
    if just_after_quiet and density_ratio < 1.0:
        flags.append(f"fresh_batch:{signature[0]}")

    # During peak load, flag low stock on a second signature item
    if density_ratio > 1.5 and len(signature) > 1:
        flags.append(f"low_stock:{signature[1]}")

    return flags


def simulate_live_signal(
    merchant_config: dict,
    density: TransactionDensity,
    current_hour: int,
) -> MerchantLiveSignal:
    """Construct a richer rolling-window view to sit alongside density.

    Buckets the last 60 minutes into 6 ten-minute slices using the same
    base rate the density used. Adds simulated inventory + staff state.
    """
    rng = random.Random(hash((merchant_config["id"], current_hour)))
    per_bucket = (density.current_hour_txns or 0) / 6.0
    buckets = [
        max(0, int(round(per_bucket * (1 + rng.gauss(0, 0.25)))))
        for _ in range(6)
    ]

    burned = round(min(1.0, max(0.0, rng.uniform(0.05, 0.65))), 2)
    active_offers = max(0, int(round(density.density_ratio * 2)))

    return MerchantLiveSignal(
        merchant_id=merchant_config["id"],
        recent_txns_60min=buckets,
        inventory_flags=_inventory_flags(merchant_config, current_hour, density.density_ratio),
        staff_capacity=_staff_capacity(density.density_ratio),
        daily_budget_burned_pct=burned,
        active_offer_count=active_offers,
    )


def simulate_live_signals_for(
    merchants: list[dict],
    densities: list[TransactionDensity],
    current_hour: int,
) -> list[MerchantLiveSignal]:
    by_id = {m["id"]: m for m in merchants}
    return [
        simulate_live_signal(by_id[d.merchant_id], d, current_hour)
        for d in densities
        if d.merchant_id in by_id
    ]


def get_merchant_configs() -> list[dict]:
    """Raw merchant entries from the city config (includes transaction_pattern).

    Routers should still call the merchants table for the user-facing list;
    this is for the simulator which needs the patterns.
    """
    return city_config.get("merchants", [])
