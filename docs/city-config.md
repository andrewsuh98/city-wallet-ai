# City Configuration

The system is designed to be city-agnostic. All city-specific data (merchants, events, coordinate bounds, Payone simulation parameters) lives in a JSON config file. Switching cities means changing one environment variable, not rewriting code.

---

## Config File Location

```
backend/city_configs/
  nyc.json        <-- active config for the hackathon demo
  stuttgart.json   <-- example: adding a second city
```

The active config is selected by the `CITY_CONFIG` environment variable:

```
CITY_CONFIG=nyc    # loads backend/city_configs/nyc.json
```

---

## Config File Schema

```json
{
  "city": "New York City",
  "country": "US",
  "currency": "USD",
  "currency_symbol": "$",
  "timezone": "America/New_York",
  "language": "en",

  "center": {
    "latitude": 40.7580,
    "longitude": -73.9855
  },
  "default_radius_meters": 1000,

  "weather": {
    "openweathermap_city_id": 5128581,
    "units": "imperial"
  },

  "merchants": [
    {
      "id": "m_001",
      "name": "Blue Bottle Coffee",
      "category": "cafe",
      "description": "Specialty coffee roaster known for single-origin pour-overs",
      "latitude": 40.7562,
      "longitude": -73.9870,
      "address": "1 Rockefeller Plaza, New York, NY 10020",
      "image_url": null,
      "rules": [
        {
          "max_discount_percent": 20,
          "min_discount_percent": 10,
          "active_hours_start": "13:00",
          "active_hours_end": "17:00",
          "trigger_conditions": ["quiet_period", "rainy", "cold"],
          "goal": "Fill quiet afternoon hours with walk-in traffic",
          "max_offers_per_day": 15,
          "offer_type": "percentage_discount",
          "budget_daily_usd": 50.00
        }
      ],
      "transaction_pattern": {
        "peak_hours": [8, 9, 10],
        "quiet_hours": [14, 15, 16],
        "avg_hourly_txns": 25,
        "weekend_modifier": 0.7
      }
    }
  ],

  "events": [
    {
      "id": "e_001",
      "name": "Broadway Week Spring 2026",
      "venue": "Times Square Area",
      "category": "festival",
      "start_time": "2026-04-20T00:00:00",
      "end_time": "2026-04-27T23:59:59",
      "latitude": 40.7580,
      "longitude": -73.9855,
      "expected_attendance": 50000
    }
  ],

  "context_tag_rules": {
    "cold_threshold_celsius": 10,
    "hot_threshold_celsius": 30,
    "quiet_density_ratio": 0.5,
    "busy_density_ratio": 1.5,
    "nearby_event_radius_meters": 500
  }
}
```

---

## Field Reference

### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `city` | string | Display name |
| `country` | string | ISO country code |
| `currency` | string | ISO currency code (USD, EUR) |
| `currency_symbol` | string | Display symbol ($, EUR) |
| `timezone` | string | IANA timezone |
| `language` | string | ISO language code |
| `center` | object | Default map center (lat/lng) |
| `default_radius_meters` | number | Default merchant search radius |

### Merchant Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (prefix with m_) |
| `name` | string | Business name |
| `category` | string | One of: cafe, restaurant, retail, bakery, bar, bookstore, grocery, fitness |
| `description` | string | Short business description for Claude prompt context |
| `latitude` / `longitude` | number | Location coordinates |
| `address` | string | Street address |
| `image_url` | string or null | Optional business image |
| `rules` | array | Merchant's offer generation rules (see MerchantRule in data-models.md) |
| `transaction_pattern` | object | Payone simulation parameters |

### Transaction Pattern

Used by `services/payone.py` to simulate realistic transaction volume.

| Field | Type | Description |
|-------|------|-------------|
| `peak_hours` | number[] | Hours (0-23) when this merchant is busiest |
| `quiet_hours` | number[] | Hours when traffic drops |
| `avg_hourly_txns` | number | Average transactions per hour (baseline) |
| `weekend_modifier` | number | Multiplier for weekend traffic (0.7 = 30% less, 1.3 = 30% more) |

### Event Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (prefix with e_) |
| `name` | string | Event name |
| `venue` | string | Venue or area name |
| `category` | string | sports, music, festival, market |
| `start_time` / `end_time` | ISO datetime | Event window |
| `latitude` / `longitude` | number | Event location |
| `expected_attendance` | number or null | Estimated crowd size |

### Context Tag Rules

Thresholds for deriving context tags from raw data. These allow tuning per city without changing code.

| Field | Type | Description |
|-------|------|-------------|
| `cold_threshold_celsius` | number | Below this temp, tag "cold" is applied |
| `hot_threshold_celsius` | number | Above this temp, tag "hot" is applied |
| `quiet_density_ratio` | number | Below this ratio, tag "quiet_period" is applied |
| `busy_density_ratio` | number | Above this ratio, tag "busy" is applied |
| `nearby_event_radius_meters` | number | Events within this radius trigger "event_nearby" tag |

---

## How to Add a New City

1. Create `backend/city_configs/{city_name}.json` following the schema above.

2. Populate merchants with real businesses:
   - Use Google Maps to find 10-15 businesses of mixed categories near the city center.
   - Use real names, addresses, and coordinates.
   - Set realistic rules for each (a cafe wants to fill quiet afternoons, a bar wants early evening traffic).
   - Define transaction patterns matching the business type.

3. Add 5-8 local events:
   - Use real event names and venues.
   - Set dates within the demo window.

4. Adjust context tag thresholds:
   - Stuttgart in winter: `cold_threshold_celsius: 5`
   - NYC in spring: `cold_threshold_celsius: 10`

5. Set the environment variable:
   ```
   CITY_CONFIG=stuttgart
   ```

6. Re-seed the database:
   ```bash
   python seed.py
   ```

No code changes required. The frontend map will automatically center on the new city's coordinates.

---

## NYC Demo Merchants (to be seeded)

These are the planned merchants for the hackathon demo. All use real NYC businesses near Midtown Manhattan.

| ID | Name | Category | Area | Key Rule |
|----|------|----------|------|----------|
| m_001 | Blue Bottle Coffee | cafe | Rockefeller Center | Quiet afternoon discounts |
| m_002 | Joe's Pizza | restaurant | Times Square | Rainy day lunch specials |
| m_003 | The Strand Bookstore | bookstore | Union Square | Weekend browse-and-buy |
| m_004 | Levain Bakery | bakery | Upper West Side | Cold weather warm treats |
| m_005 | Shake Shack | restaurant | Madison Square | Post-event crowd deals |
| m_006 | McNally Jackson Books | bookstore | Nolita | Quiet weekday afternoon |
| m_007 | Cha Cha Matcha | cafe | NoMad | Morning energy boost |
| m_008 | The Smith | restaurant | Midtown | Early dinner fill |
| m_009 | Whole Foods Market | grocery | Columbus Circle | Evening commuter quick-stop |
| m_010 | Equinox | fitness | Midtown | Off-peak class promo |
| m_011 | Beecher's Handmade Cheese | retail | Flatiron | Lunchtime tasting offer |
| m_012 | Stumptown Coffee | cafe | Greenwich Village | Rainy afternoon refuge |

Each merchant will have 1-2 rules targeting different context conditions, ensuring that any given moment produces 2-4 eligible merchants for offer generation.
