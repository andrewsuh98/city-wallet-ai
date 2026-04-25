# API Reference

Base URL: `http://localhost:8000/api`

All requests and responses use JSON. The backend runs FastAPI, which auto-generates interactive docs at `http://localhost:8000/docs` (Swagger UI).

---

## Authentication

No user authentication. Identity is tracked via a `session_id` (UUID v4) that the frontend generates on first visit and stores in `localStorage`. The session ID is sent as a query parameter or in the request body where relevant.

No merchant authentication for the hackathon. The merchant dashboard is accessible directly at `/merchant`.

---

## CORS

The backend allows requests from `http://localhost:3000` (Next.js dev server). Configured in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Endpoints

### Context

#### `POST /api/context`

Get the composite context state for a given location. This fetches weather, events, and transaction density in parallel, then composes them into a single `ContextState` object.

**Request:**

```json
{
  "latitude": 40.7580,
  "longitude": -73.9855,
  "accuracy_meters": 15.0
}
```

**Response (200):**

```json
{
  "timestamp": "2026-04-25T14:32:00Z",
  "location": {
    "latitude": 40.7580,
    "longitude": -73.9855,
    "accuracy_meters": 15.0
  },
  "weather": {
    "condition": "rain",
    "temp_celsius": 12.5,
    "humidity": 85,
    "description": "light rain"
  },
  "time_of_day": "afternoon",
  "day_of_week": "saturday",
  "is_weekend": true,
  "nearby_events": [
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
  "merchant_densities": [
    {
      "merchant_id": "m_001",
      "current_hour_txns": 8,
      "avg_hour_txns": 25.0,
      "density_ratio": 0.32,
      "trend": "quiet"
    }
  ],
  "context_tags": ["rainy", "weekend_afternoon", "quiet_cafes", "event_nearby", "cold"],
  "urgency_score": 0.7
}
```

**Caching:** Weather data is cached for 10 minutes. Events are loaded from city config (effectively static). Transaction density is computed fresh each call (simulated).

---

### Offers

#### `POST /api/offers/generate`

Generate personalized offers based on the current context. This is the core endpoint that calls Claude.

**Request:**

```json
{
  "session_id": "a7f3b2c1-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "context": { "<ContextState object from POST /api/context>" : "..." },
  "max_offers": 3,
  "user_preferences": {
    "intent_tags": ["warm_drink", "sit_down"],
    "past_categories": ["cafe", "bakery"]
  }
}
```

`user_preferences` is optional. It simulates the output of an on-device SLM that would classify user intent locally. If omitted, offers are generated based on context alone.

**Response (200):**

```json
{
  "offers": [
    {
      "id": "off_a1b2c3",
      "merchant_id": "m_001",
      "merchant_name": "Blue Bottle Coffee",
      "merchant_category": "cafe",
      "headline": "Cold outside? Your cappuccino is waiting.",
      "subtext": "15% off at Blue Bottle, 2 min walk",
      "description": "Warm up with a handcrafted cappuccino at Blue Bottle Coffee. Their Rockefeller Center location is quiet right now, so you will get a table by the window.",
      "discount_value": "15%",
      "discount_type": "percentage_discount",
      "context_tags": ["rainy", "cold", "quiet_cafes"],
      "why_now": "It's raining and this cafe is unusually quiet for a Saturday afternoon.",
      "created_at": "2026-04-25T14:32:05Z",
      "expires_at": "2026-04-25T15:02:05Z",
      "style": {
        "background_gradient": ["#4A2C2A", "#D4A574"],
        "tone": "warm",
        "headline_style": "emotional"
      },
      "status": "active",
      "distance_meters": 180,
      "redemption_token": null
    }
  ],
  "generation_time_ms": 1850,
  "context_summary": "Rainy Saturday afternoon near Times Square. Several cafes are quiet. Broadway Week is happening nearby."
}
```

**Latency:** Typically 1.5-3 seconds (dominated by Claude API call). The frontend should show a loading skeleton during this time.

**Failure:** If Claude fails or times out (5s), the backend responds with `503 Offer generation unavailable`. There is no fallback pool.

---

#### `GET /api/offers`

Get all offers for a session.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | yes | The user's session UUID |
| `status` | string | no | Filter by status: active, accepted, declined, expired, redeemed |

**Response (200):**

```json
{
  "offers": [ "<Offer objects>" ]
}
```

---

#### `PATCH /api/offers/{offer_id}`

Accept, decline, or dismiss an offer.

**Request:**

```json
{
  "action": "accept"
}
```

Valid actions: `"accept"`, `"decline"`, `"dismiss"`

**Response (200) for accept:**

```json
{
  "offer": {
    "...all offer fields...",
    "status": "accepted",
    "redemption_token": "a7f3b2c1-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
  }
}
```

**Response (200) for decline/dismiss:**

```json
{
  "offer": {
    "...all offer fields...",
    "status": "declined"
  }
}
```

**Error (404):**

```json
{
  "detail": "Offer not found"
}
```

**Error (400):**

```json
{
  "detail": "Offer has already been redeemed"
}
```

---

### Merchants

#### `GET /api/merchants`

List all merchants, optionally filtered by proximity.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lat` | float | no | User latitude for distance filtering |
| `lng` | float | no | User longitude for distance filtering |
| `radius_m` | int | no | Radius in meters (default: 1000) |
| `category` | string | no | Filter by category |

**Response (200):**

```json
{
  "merchants": [
    {
      "id": "m_001",
      "name": "Blue Bottle Coffee",
      "category": "cafe",
      "description": "Specialty coffee roaster",
      "latitude": 40.7562,
      "longitude": -73.9870,
      "address": "1 Rockefeller Plaza, New York, NY 10020",
      "image_url": null,
      "rules": []
    }
  ]
}
```

Note: `rules` are included only when fetching a single merchant or the merchant's own dashboard.

---

#### `GET /api/merchants/{merchant_id}`

Get a single merchant with full details including rules.

**Response (200):**

```json
{
  "id": "m_001",
  "name": "Blue Bottle Coffee",
  "category": "cafe",
  "description": "Specialty coffee roaster",
  "latitude": 40.7562,
  "longitude": -73.9870,
  "address": "1 Rockefeller Plaza, New York, NY 10020",
  "image_url": null,
  "rules": [
    {
      "id": "r_001",
      "merchant_id": "m_001",
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
  ]
}
```

---

#### `GET /api/merchants/{merchant_id}/rules`

Get just the rules for a merchant.

**Response (200):**

```json
{
  "rules": [ "<MerchantRule objects>" ]
}
```

---

#### `PUT /api/merchants/{merchant_id}/rules`

Update a merchant's rules. Replaces all existing rules.

**Request:**

```json
{
  "rules": [
    {
      "max_discount_percent": 25,
      "min_discount_percent": 10,
      "active_hours_start": "14:00",
      "active_hours_end": "18:00",
      "trigger_conditions": ["quiet_period", "rainy"],
      "goal": "Increase afternoon foot traffic during slow hours",
      "max_offers_per_day": 20,
      "offer_type": "percentage_discount",
      "budget_daily_usd": 75.00
    }
  ]
}
```

**Response (200):**

```json
{
  "rules": [ "<updated MerchantRule objects with assigned IDs>" ]
}
```

---

#### `GET /api/merchants/{merchant_id}/analytics`

Get offer performance analytics for a merchant.

**Response (200):**

```json
{
  "merchant_id": "m_001",
  "total_generated": 47,
  "total_accepted": 18,
  "total_declined": 12,
  "total_expired": 17,
  "total_redeemed": 14,
  "acceptance_rate": 0.383,
  "redemption_rate": 0.778,
  "top_context_triggers": ["rainy", "quiet_period", "cold"],
  "revenue_impact_estimate": 156.80
}
```

`revenue_impact_estimate` is a simple calculation: sum of estimated discount values for redeemed offers. It gives the merchant a sense of how much they "invested" in offers.

---

### Redemption

#### `POST /api/redeem`

Redeem an offer using its token. Called when the merchant confirms the QR scan.

**Request:**

```json
{
  "offer_id": "off_a1b2c3",
  "token": "a7f3b2c1-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

**Response (200):**

```json
{
  "success": true,
  "offer": {
    "...all offer fields...",
    "status": "redeemed"
  },
  "message": "Enjoy your cappuccino! $2.40 cashback applied.",
  "cashback_amount": 2.40
}
```

**Error (400):**

```json
{
  "success": false,
  "offer": null,
  "message": "Invalid or expired token",
  "cashback_amount": null
}
```

---

#### `GET /api/redeem/validate/{token}`

Validate a token without redeeming it. Used by the merchant QR scanner to preview the offer before confirming.

**Response (200):**

```json
{
  "valid": true,
  "offer": { "<Offer object>" },
  "merchant_name": "Blue Bottle Coffee"
}
```

**Response (200, invalid token):**

```json
{
  "valid": false,
  "offer": null,
  "merchant_name": null
}
```

---

## Error Format

All errors follow FastAPI's standard format:

```json
{
  "detail": "Human-readable error message"
}
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid action, expired offer, invalid token) |
| 404 | Resource not found |
| 422 | Validation error (Pydantic rejected the request body) |
| 500 | Server error (Claude API failure with no fallback, DB error) |

---

## Demo Mode

Add `?demo=rainy_afternoon` to the context request to override real weather/time with a preset scenario. Supported demo scenarios:

| Key | Weather | Time | Extra |
|-----|---------|------|-------|
| `rainy_afternoon` | Rain, 11C | Tuesday 2:30 PM | Low transaction density at cafes |
| `hot_weekend` | Clear, 32C | Saturday 12:00 PM | Ice cream shops and outdoor cafes highlighted |
| `event_night` | Cloudy, 18C | Friday 7:00 PM | Concert at Madison Square Garden, restaurants busy |

The demo override is passed as a query param on `POST /api/context`:

```
POST /api/context?demo=rainy_afternoon
```

The response includes a `demo_mode: true` field so the frontend can show a "Demo Mode" badge.
