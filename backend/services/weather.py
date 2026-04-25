"""OpenWeatherMap client with 10-minute caching and graceful fallback.

Swap this module to support a different provider (DWD, etc.) without
touching the rest of the app — only the public functions matter.
"""

import time
from typing import Optional

import httpx

from config import OPENWEATHERMAP_API_KEY, city_config
from models import WeatherCondition, WeatherData


CACHE_TTL_SECONDS = 600
OWM_URL = "https://api.openweathermap.org/data/2.5/weather"

_cache: dict = {"weather": None, "fetched_at": 0.0}


def _map_condition(owm_id: int) -> WeatherCondition:
    if 200 <= owm_id < 300:
        return WeatherCondition.STORM
    if 300 <= owm_id < 600:
        return WeatherCondition.RAIN
    if 600 <= owm_id < 700:
        return WeatherCondition.SNOW
    if owm_id == 800:
        return WeatherCondition.CLEAR
    return WeatherCondition.CLOUDY


def _fallback() -> WeatherData:
    return WeatherData(
        condition=WeatherCondition.CLOUDY,
        temp_celsius=15.0,
        humidity=60,
        description="cloudy (fallback)",
    )


async def get_weather(force_refresh: bool = False) -> WeatherData:
    now = time.time()
    if (
        not force_refresh
        and _cache["weather"] is not None
        and now - _cache["fetched_at"] < CACHE_TTL_SECONDS
    ):
        return _cache["weather"]

    if not OPENWEATHERMAP_API_KEY:
        weather = _fallback()
        _cache["weather"] = weather
        _cache["fetched_at"] = now
        return weather

    city_id = city_config["weather"]["openweathermap_city_id"]
    params = {"id": city_id, "appid": OPENWEATHERMAP_API_KEY, "units": "metric"}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(OWM_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        owm_id = data["weather"][0]["id"]
        weather = WeatherData(
            condition=_map_condition(owm_id),
            temp_celsius=float(data["main"]["temp"]),
            humidity=int(data["main"]["humidity"]),
            description=data["weather"][0].get("description", ""),
        )
    except Exception:
        weather = _fallback()

    _cache["weather"] = weather
    _cache["fetched_at"] = now
    return weather


def override_cache(weather: Optional[WeatherData]) -> None:
    """For demo_mode: inject a preset reading without an API call."""
    if weather is None:
        _cache["weather"] = None
        _cache["fetched_at"] = 0.0
    else:
        _cache["weather"] = weather
        _cache["fetched_at"] = time.time()
