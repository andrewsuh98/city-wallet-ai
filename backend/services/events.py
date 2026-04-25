"""Local event loader. Reads from the city config; swap for a live API
(Eventbrite, NYC Open Data) without touching callers.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

from config import city_config
from models import EventData
from services.geo import haversine_meters


def _parse_dt(value) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value))


async def get_nearby_events(
    lat: float,
    lng: float,
    now: datetime | None = None,
) -> list[EventData]:
    tz = ZoneInfo(city_config.get("timezone", "UTC"))
    if now is None:
        now = datetime.now(tz)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=tz)

    radius = city_config["context_tag_rules"]["nearby_event_radius_meters"]

    raw_events = city_config.get("events", [])
    nearby: list[EventData] = []

    for e in raw_events:
        start = _parse_dt(e["start_time"])
        end = _parse_dt(e["end_time"]) if e.get("end_time") else None
        if start.tzinfo is None:
            start = start.replace(tzinfo=tz)
        if end is not None and end.tzinfo is None:
            end = end.replace(tzinfo=tz)

        if start > now:
            continue
        if end is not None and end < now:
            continue

        distance = haversine_meters(lat, lng, e["latitude"], e["longitude"])
        if distance > radius:
            continue

        nearby.append(
            EventData(
                id=e["id"],
                name=e["name"],
                venue=e["venue"],
                category=e["category"],
                start_time=start,
                end_time=end,
                latitude=e["latitude"],
                longitude=e["longitude"],
                expected_attendance=e.get("expected_attendance"),
            )
        )

    return nearby
