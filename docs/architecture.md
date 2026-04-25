# Architecture

## Overview

City Wallet is a real-time, AI-powered offer platform that connects local merchants with nearby consumers through context-aware, dynamically generated deals. The system observes the current moment (weather, time, location, events, transaction volume) and uses Claude to generate offers that feel crafted for that exact situation.

The architecture is split into a **Next.js frontend** (consumer app + merchant dashboard) and a **Python FastAPI backend** (context sensing, offer generation, redemption). They communicate over REST. Data lives in SQLite.

---

## System Diagram

```
+------------------------------------------------------------------+
|                        FRONTEND (Next.js)                        |
|                                                                  |
|  +------------------+  +------------------+  +-----------------+ |
|  |  Consumer App    |  |  Merchant        |  |  Privacy /      | |
|  |  - Map (Mapbox)  |  |  Dashboard       |  |  GDPR Page      | |
|  |  - Offer Feed    |  |  - Rule Editor   |  |  - Consent      | |
|  |  - Wallet        |  |  - Analytics     |  |  - SLM Diagram  | |
|  |  - QR Display    |  |  - QR Scanner    |  |                 | |
|  +--------+---------+  +--------+---------+  +-----------------+ |
|           |                      |                                |
|     [Geolocation API]     [Direct URL]                           |
|           |                      |                                |
+-----------+----------------------+--------------------------------+
            |    REST /api/*       |
            v                      v
+------------------------------------------------------------------+
|                       BACKEND (FastAPI)                           |
|                                                                  |
|  +------------------+  +------------------+  +-----------------+ |
|  | Context Service  |  |  Offer Service   |  | Redemption Svc  | |
|  | - Weather fetch  |  |  - Claude API    |  | - Token gen     | |
|  | - Events fetch   |  |  - Rule matching |  | - QR gen        | |
|  | - Payone sim     |  |  - Post-process  |  | - Validate      | |
|  | - State compose  |  |  - Store offers  |  | - Analytics     | |
|  +--------+---------+  +--------+---------+  +--------+--------+ |
|           |                      |                     |          |
|           +----------+-----------+---------------------+          |
|                      v                                            |
|                 [SQLite DB]                                       |
|                                                                  |
+------------------------------------------------------------------+
            |              |              |
            v              v              v
   [OpenWeatherMap]  [NYC Open Data]  [Claude API]
```

---

## Data Flow: From Location to Offer

```
1. User opens app
   Browser Geolocation API -> lat/lng

2. Frontend sends location to backend
   POST /api/context { latitude, longitude }

3. Backend assembles context (parallel fetches)
   +-> OpenWeatherMap API -> WeatherData
   +-> NYC Open Data / config -> EventData[]
   +-> Payone simulator -> TransactionDensity[]
   +-> Time computation -> time_of_day, day_of_week
   ==> Compose into ContextState with context_tags[]

4. Frontend requests offers
   POST /api/offers/generate { context, max_offers, user_preferences }

5. Backend generates offers
   a. Filter merchants by proximity + active rules + trigger match
   b. Send eligible merchants + context to Claude API
   c. Claude returns creative offer content + GenUI style
   d. Post-process: validate against rules, assign tokens, store in DB
   ==> Return Offer[]

6. Frontend renders offers
   OfferCard uses style.background_gradient, style.emoji, style.tone
   Each card is visually unique (GenUI)

7. User accepts offer
   PATCH /api/offers/{id} { action: "accept" }
   ==> Returns offer with redemption_token

8. User shows QR at merchant
   /redeem/{id} page displays QR encoding the token URL

9. Merchant scans QR
   GET /api/redeem/validate/{token} -> offer details
   POST /api/redeem { offer_id, token } -> marks redeemed
```

---

## Tech Stack Rationale

| Choice | Why |
|--------|-----|
| **Next.js (App Router)** | Fast to scaffold, Tailwind built in, App Router for clean routing, mobile-responsive out of the box. No native app setup overhead. |
| **FastAPI** | Team is strongest in Python. Async support for parallel API calls. Pydantic models enforce typed contracts. Auto-generated OpenAPI docs at `/docs`. |
| **Claude API (Sonnet)** | Generates creative, context-aware offer content and visual style in a single call. Sonnet balances quality with latency (~2s for 3 offers). |
| **SQLite** | Zero configuration. No Docker, no server. Single file database. Sufficient for a demo with one concurrent user. |
| **Mapbox** | Beautiful default styles, generous free tier, `react-map-gl` for React integration, supports custom markers and popups. |
| **Tailwind CSS** | Utility-first CSS for rapid UI prototyping. No stylesheet management. Works perfectly with dynamic GenUI styling via inline classes. |

---

## Component Responsibilities

### Frontend

| Component | Responsibility |
|-----------|---------------|
| `page.tsx` (home) | Main consumer view. Map on top, offer feed below. Polls for context and offers on location change. |
| `OfferCard.tsx` | The single most important UI component. Renders a Claude-generated offer with dynamic GenUI styling. Must achieve 3-second comprehension. |
| `MapView.tsx` | Mapbox map showing user location pin and nearby merchant markers. Clicking a merchant shows their active offer. |
| `ContextBar.tsx` | Horizontal bar of badges showing current context signals: weather, time, nearby events. Gives the user transparency into why they see certain offers. |
| `wallet/page.tsx` | List of accepted offers with their QR codes and expiry timers. The user's "wallet." |
| `merchant/page.tsx` | Dashboard showing offer performance: generated, accepted, redeemed counts. Charts for acceptance rate over time. |
| `merchant/rules/page.tsx` | Form where merchants set their rules: discount range, active hours, trigger conditions, goal description. |
| `merchant/scan/page.tsx` | Camera-based QR scanner for merchants to validate redemption tokens at the point of sale. |
| `privacy/page.tsx` | GDPR explainer page with on-device SLM architecture diagram and consent flow documentation. |

### Backend

| Service | Responsibility |
|---------|---------------|
| `services/weather.py` | Calls OpenWeatherMap API. Caches responses for 10 minutes. Returns `WeatherData`. |
| `services/events.py` | Returns nearby events from hardcoded city config (or NYC Open Data if wired). Returns `EventData[]`. |
| `services/payone.py` | Simulates Payone transaction density per merchant using time-based curves with gaussian noise. Returns `TransactionDensity[]`. |
| `services/context.py` | Orchestrates parallel calls to weather, events, and payone services. Computes time signals. Derives `context_tags` and `urgency_score`. Returns `ContextState`. |
| `services/offer_engine.py` | Filters eligible merchants, constructs Claude prompt, calls Claude API, validates response against merchant rules, assigns tokens, stores in DB. Returns `Offer[]`. |
| `services/redemption.py` | Generates QR code images, validates tokens, marks offers as redeemed, computes cashback amounts. |

---

## Key Design Decisions

**Single Claude call for multiple offers.** One call generating 3 offers takes ~2s. Three separate calls would take ~6s. The user should see offers within 3 seconds of context being determined.

**Context tags as the bridge.** Raw data (12.5C, 85% humidity) is transformed into semantic tags (`rainy`, `cold`). These tags are human-readable, matchable against merchant trigger conditions, and directly usable in Claude prompts. The tag derivation logic is the only place that interprets raw signals.

**GenUI via style hints.** Claude returns structured style data (gradients, emoji, tone) rather than actual CSS or HTML. The frontend interprets these hints into visual styling. This keeps the AI output structured and the rendering deterministic.

**City-configurable via JSON.** Merchant data, events, coordinate bounds, and Payone simulation parameters live in `city_configs/nyc.json`. Adding Stuttgart means creating `stuttgart.json` and setting `CITY_CONFIG=stuttgart`. No code changes.

**Session-based identity.** A UUID in localStorage identifies the user. No login, no PII, no auth complexity. Clean GDPR story: "We store a random session ID. No personal information is collected."

---

## Environment Variables

```
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
OPENWEATHERMAP_API_KEY=...
CITY_CONFIG=nyc
DATABASE_URL=sqlite:///./city_wallet.db

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

---

## Running the Stack

```bash
# Terminal 1: Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in API keys
python seed.py        # populate merchants
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
cp .env.local.example .env.local  # fill in tokens
npm run dev
```

Open `http://localhost:3000` for the consumer app, `http://localhost:3000/merchant` for the merchant dashboard.
