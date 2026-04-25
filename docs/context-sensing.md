# Module 01: Context Sensing Layer

## Purpose

The Context Sensing Layer is the foundation of City Wallet. It aggregates real-time signals (weather, time, location, events, transaction density) and composes them into a single `ContextState` object. This object is the input to the Generative Offer Engine.

The key insight: raw data (12.5C, 85% humidity, 8 transactions this hour) is not useful for offer generation. The Context Sensing Layer transforms raw data into semantic **context tags** like `["rainy", "cold", "quiet_cafes", "lunch_hour"]`. These tags are the bridge between the physical world and the AI.

---

## Signal Sources

### 1. Weather (real API)

**Source:** OpenWeatherMap Current Weather API

**Implementation:** `backend/services/weather.py`

**API Call:**
```
GET https://api.openweathermap.org/data/2.5/weather?id={city_id}&appid={key}&units=metric
```

**Output:** `WeatherData`
- `condition`: mapped from OWM weather codes (200-599 = rain/storm, 600-699 = snow, 800 = clear, 801+ = cloudy)
- `temp_celsius`: temperature
- `humidity`: percentage
- `description`: OWM's human-readable string (e.g. "light rain")

**Caching:** Cache the response for 10 minutes. Weather does not change faster than that, and OWM's free tier allows 60 calls/minute but there is no reason to hit it that often.

**Failure mode:** If the API is down, return a default "cloudy, 15C" response. Never block offer generation because of a weather API failure.

### 2. Time (computed)

**Source:** Server clock + city timezone from config

**Implementation:** Part of `backend/services/context.py`

**Output:**
- `time_of_day`: derived from hour
  - 5-8: "early_morning"
  - 8-11: "morning"
  - 11-14: "lunch"
  - 14-17: "afternoon"
  - 17-21: "evening"
  - 21-5: "night"
- `day_of_week`: "monday" through "sunday"
- `is_weekend`: true for Saturday/Sunday

### 3. Events (config-based, optionally live)

**Source:** Hardcoded in `city_configs/nyc.json`, optionally supplemented by NYC Open Data API

**Implementation:** `backend/services/events.py`

**Logic:**
1. Load events from city config
2. Filter to events currently active (now is between start_time and end_time)
3. Filter to events within `nearby_event_radius_meters` of user location
4. Return as `EventData[]`

**Optional live integration:** NYC Open Data has a free, unauthenticated API for permitted events:
```
GET https://data.cityofnewyork.us/resource/tvpp-9vvx.json?$where=start_date_time > '{now}'&$limit=50
```

For the hackathon, the hardcoded events are sufficient and more reliable.

### 4. Transaction Density (simulated)

**Source:** Simulated Payone transaction feed

**Implementation:** `backend/services/payone.py`

**Purpose:** Each merchant has a transaction pattern defined in the city config. The simulator generates realistic transaction counts for the current hour, making it possible to detect "quiet" vs "busy" periods.

**Algorithm:**

```python
import random
from datetime import datetime

def simulate_density(merchant_config, current_hour, weather, is_weekend):
    base = merchant_config["transaction_pattern"]["avg_hourly_txns"]

    # Hour modifier
    if current_hour in merchant_config["transaction_pattern"]["peak_hours"]:
        hour_mod = 1.5
    elif current_hour in merchant_config["transaction_pattern"]["quiet_hours"]:
        hour_mod = 0.4
    else:
        hour_mod = 1.0

    # Weather modifier (rain reduces foot traffic)
    weather_mod = 0.7 if weather.condition in ("rain", "storm") else 1.0

    # Weekend modifier (from config, e.g. 0.7 for cafes, 1.3 for bars)
    weekend_mod = merchant_config["transaction_pattern"]["weekend_modifier"] if is_weekend else 1.0

    # Gaussian noise for realism
    noise = random.gauss(0, 0.15)

    current_txns = int(base * hour_mod * weather_mod * weekend_mod * (1 + noise))
    current_txns = max(0, current_txns)
    density_ratio = current_txns / base if base > 0 else 1.0

    # Classify trend
    if density_ratio < 0.5:
        trend = "quiet"
    elif density_ratio < 1.2:
        trend = "normal"
    elif density_ratio < 1.8:
        trend = "busy"
    else:
        trend = "surging"

    return TransactionDensity(
        merchant_id=merchant_config["id"],
        current_hour_txns=current_txns,
        avg_hour_txns=base,
        density_ratio=round(density_ratio, 2),
        trend=trend,
    )
```

**Why simulate?** Payone is a real DSV asset, but we do not have API access. The simulation creates realistic-looking data that demonstrates the concept: quiet periods can be detected and used as offer triggers. The simulation parameters are per-merchant and per-city, configured in JSON.

### 5. User Location (real browser API)

**Source:** Browser Geolocation API (frontend)

**Implementation:** `frontend/src/hooks/useGeolocation.ts`

The frontend calls `navigator.geolocation.watchPosition()` and sends lat/lng to the backend. The backend uses this for:
- Filtering nearby merchants (within 500m by default)
- Calculating distance to each merchant for the offer display
- Determining which events are "nearby"

**Fallback:** If geolocation is denied, default to Times Square (40.7580, -73.9855). Show a banner: "Using default location. Enable location for personalized offers."

---

## Context Composition

**Implementation:** `backend/services/context.py`

The `compose_context()` function orchestrates everything:

```python
async def compose_context(lat: float, lng: float, demo_mode: str = None) -> ContextState:
    # If demo mode, return preset context
    if demo_mode:
        return get_demo_context(demo_mode, lat, lng)

    # Fetch signals in parallel
    weather, events, merchants = await asyncio.gather(
        get_weather(),
        get_nearby_events(lat, lng),
        get_all_merchants(),
    )

    # Compute time signals
    now = datetime.now(ZoneInfo(config.timezone))
    time_of_day = classify_time(now.hour)
    day_of_week = now.strftime("%A").lower()
    is_weekend = day_of_week in ("saturday", "sunday")

    # Simulate transaction density for each nearby merchant
    nearby_merchants = filter_by_distance(merchants, lat, lng, config.default_radius_meters)
    densities = [
        simulate_density(m, now.hour, weather, is_weekend)
        for m in nearby_merchants
    ]

    # Derive context tags
    tags = derive_context_tags(weather, time_of_day, day_of_week, is_weekend, events, densities)

    # Compute urgency score
    urgency = compute_urgency(tags, weather, densities)

    return ContextState(
        timestamp=now,
        location=UserLocation(latitude=lat, longitude=lng),
        weather=weather,
        time_of_day=time_of_day,
        day_of_week=day_of_week,
        is_weekend=is_weekend,
        nearby_events=events,
        merchant_densities=densities,
        context_tags=tags,
        urgency_score=urgency,
    )
```

---

## Context Tags

Context tags are the most important derived field. They translate raw data into semantic labels that merchant rules can match against and Claude can reason about.

### Tag Derivation Rules

| Tag | Condition |
|-----|-----------|
| `cold` | temp_celsius < cold_threshold (default 10C) |
| `hot` | temp_celsius > hot_threshold (default 30C) |
| `rainy` | weather condition is rain or storm |
| `snowy` | weather condition is snow |
| `clear_sky` | weather condition is clear |
| `early_morning` | time_of_day == "early_morning" |
| `morning` | time_of_day == "morning" |
| `lunch_hour` | time_of_day == "lunch" |
| `afternoon` | time_of_day == "afternoon" |
| `evening` | time_of_day == "evening" |
| `night` | time_of_day == "night" |
| `weekday` | is_weekend == false |
| `weekend` | is_weekend == true |
| `event_nearby` | at least one active event within radius |
| `quiet_period` | any merchant density_ratio < quiet_threshold (0.5) |
| `busy_area` | average density_ratio > busy_threshold (1.5) |
| `quiet_cafes` | any cafe-category merchant has trend == "quiet" |
| `quiet_restaurants` | any restaurant-category merchant has trend == "quiet" |

Thresholds are configurable per city in `context_tag_rules` in the city config.

### Example Context Tag Sets

**Rainy Tuesday afternoon, cafes are quiet:**
```
["rainy", "cold", "afternoon", "weekday", "quiet_period", "quiet_cafes"]
```

**Sunny Saturday during a festival:**
```
["clear_sky", "hot", "weekend", "lunch_hour", "event_nearby", "busy_area"]
```

**Cold weekday evening, nothing special:**
```
["cold", "evening", "weekday"]
```

---

## Urgency Score

A float from 0.0 to 1.0 that indicates how time-sensitive the current context is. Higher urgency means offers should expire sooner and use more direct language.

**Factors that increase urgency:**
- Rain or storm (+0.2): people want to get indoors
- Lunch hour (+0.15): narrow time window
- Quiet merchants (+0.15): the offer opportunity is fleeting
- Event nearby (+0.1): crowd could disperse
- Cold weather (+0.1): comfort-seeking behavior

**Factors that decrease urgency:**
- Weekend afternoon (-0.1): leisurely browsing
- Clear sky (-0.05): no weather pressure

The score is clamped to [0.0, 1.0]. It influences offer expiry time (high urgency = 15-20 min, low = 45-60 min) and Claude's tone selection.

---

## Configurability

The challenge requires that "a different city or data source should slot in as a configuration, not a rewrite."

Everything city-specific lives in `city_configs/{city}.json`:
- Merchant list and their transaction patterns
- Events
- Context tag thresholds (what counts as "cold" in Stuttgart vs NYC)
- Map center coordinates
- Currency, timezone, language

Everything API-specific is behind service interfaces:
- Weather: swap OpenWeatherMap for DWD (German Weather Service) by changing `weather.py`
- Events: swap hardcoded for Eventbrite by changing `events.py`
- Transactions: swap simulated for real Payone by changing `payone.py`

No router, model, or frontend code needs to change when switching cities or data sources.

---

## Files

| File | Purpose |
|------|---------|
| `backend/services/weather.py` | OpenWeatherMap client with 10-min caching |
| `backend/services/events.py` | Event loader (config-based or API) |
| `backend/services/payone.py` | Simulated transaction density generator |
| `backend/services/context.py` | Orchestrator: parallel fetch, tag derivation, urgency scoring |
| `backend/routers/context.py` | POST /api/context endpoint |
| `backend/city_configs/nyc.json` | NYC merchant/event/threshold configuration |
| `backend/config.py` | Loads city config, exposes settings |
