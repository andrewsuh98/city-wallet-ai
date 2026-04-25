# City Wallet

AI-powered city wallet for the DSV-Gruppe hackathon challenge (April 25-26, 2026). Generates real-time, context-aware offers for local merchants using Claude.

## Stack

- **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS) in `/frontend`
- **Backend:** Python FastAPI in `/backend`
- **AI:** Claude API (Sonnet) for dynamic offer generation
- **Database:** SQLite via aiosqlite
- **Map:** Mapbox via react-map-gl

## Running the Project

```bash
# Backend (terminal 1)
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend (terminal 2)
cd frontend
npm run dev
```

Consumer app: `http://localhost:3000`
Merchant dashboard: `http://localhost:3000/merchant`
API docs (Swagger): `http://localhost:8000/docs`

## Project Structure

```
backend/
  main.py              # FastAPI app entry, CORS
  config.py            # City config loader, env vars
  database.py          # SQLite setup
  models.py            # Pydantic models (shared types)
  seed.py              # Seed merchants from city config
  services/            # Business logic
    weather.py         # OpenWeatherMap client
    events.py          # Event data loader
    payone.py          # Simulated transaction density
    context.py         # Context state composer
    offer_engine.py    # Claude API offer generation
    redemption.py      # QR/token generation + validation
  routers/             # API route handlers
    context.py         # POST /api/context
    offers.py          # POST /api/offers/generate, GET, PATCH
    merchants.py       # Merchant CRUD + analytics
    redemption.py      # POST /api/redeem, GET validate
  city_configs/
    nyc.json           # NYC merchants, events, thresholds

frontend/src/
  app/
    page.tsx           # Consumer home (map + offers)
    wallet/            # Accepted offers
    offer/[id]/        # Offer detail
    redeem/[id]/       # QR code display
    merchant/          # Dashboard, rules, QR scanner
    privacy/           # GDPR explainer
  components/          # Reusable UI components
  hooks/               # useGeolocation, useContext, useOffers
  lib/
    api.ts             # Backend API client
    types.ts           # TypeScript types (mirror backend models)
```

## Documentation

All specs live in `/docs`. Read these before writing code for a module.

| Doc | What it covers |
|-----|----------------|
| [architecture.md](docs/architecture.md) | System diagram, data flow, tech rationale, component responsibilities |
| [data-models.md](docs/data-models.md) | Pydantic models, SQLite schema, TypeScript types. **The single source of truth for the API contract.** |
| [api-reference.md](docs/api-reference.md) | All endpoints with request/response JSON, error format, demo mode |
| [context-sensing.md](docs/context-sensing.md) | Module 01: signal sources, context tags, urgency scoring |
| [offer-engine.md](docs/offer-engine.md) | Module 02: Claude prompt, merchant rules, GenUI style system |
| [checkout-redemption.md](docs/checkout-redemption.md) | Module 03: QR flow, token lifecycle, cashback, merchant scan |
| [ux-design.md](docs/ux-design.md) | OfferCard layout, 3-second hierarchy, animations, dark mode, typography |
| [privacy-gdpr.md](docs/privacy-gdpr.md) | On-device SLM architecture, consent flow, GDPR compliance |
| [demo-guide.md](docs/demo-guide.md) | Setup, demo mode scenarios, full demo script, backup plans |
| [city-config.md](docs/city-config.md) | Config schema, how to add a city, NYC merchant list |

## Key Architecture Concepts

**Context tags** are the bridge between raw data and offers. Raw signals (12.5C, 85% humidity) become semantic tags (`rainy`, `cold`, `quiet_cafes`). Merchant rules match against these tags. Claude uses them in prompts. See [context-sensing.md](docs/context-sensing.md).

**GenUI style hints** are how Claude controls visual presentation. Each offer includes a `style` object with `background_gradient`, `emoji`, `tone`, and `headline_style`. The frontend interprets these into CSS. See [offer-engine.md](docs/offer-engine.md) and [ux-design.md](docs/ux-design.md).

**The ContextState object** is the central data structure. Everything flows through it. See [data-models.md](docs/data-models.md).

## Coding Conventions

### General

- No emojis in code or comments
- Use straight quotes, never curly quotes
- Keep commits small and focused. One feature or fix per commit.

### Python (backend)

- All models in `models.py`. Do not define Pydantic models in routers or services.
- All API routes go through `routers/`. Services contain business logic only, no HTTP concerns.
- Use `async def` for all route handlers and service functions that do I/O.
- JSON arrays/objects stored in SQLite as TEXT. Serialize with `json.dumps()`, deserialize with `json.loads()`.
- Cache external API responses (weather: 10 min). Never block offer generation on a failed external call.
- When installing new packages: `pip install <package>`, then `pip freeze > requirements.txt`.

### TypeScript (frontend)

- All types in `lib/types.ts`. These mirror `backend/models.py` exactly. If you change a model, update both files.
- All API calls go through `lib/api.ts`. Components never call `fetch` directly.
- Components in `components/`. Page-level layouts in `app/`.
- Use Tailwind classes. No CSS modules or styled-components.
- Dark mode only. Background `#0F0F0F`, surface `#1A1A1A`.

### API Contract

The backend and frontend communicate over REST. The contract is defined in:
- Python: `backend/models.py` (Pydantic)
- TypeScript: `frontend/src/lib/types.ts`
- Human-readable: [api-reference.md](docs/api-reference.md)

If you change an endpoint or model, update all three.

## Environment Variables

```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
OPENWEATHERMAP_API_KEY=...
CITY_CONFIG=nyc
DATABASE_URL=sqlite:///./city_wallet.db

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

Never commit `.env` or `.env.local`. Use `.env.example` and `.env.local.example` as templates.

## Demo Mode

Append `?demo=rainy_afternoon` to the app URL for a controlled demo scenario. This overrides weather and time with preset values while still calling Claude for fresh offer generation. See [demo-guide.md](docs/demo-guide.md) for all scenarios and the full demo script.

## Team Assignments

- **Frontend/UX** (2 people): Next.js app, all components, map, offer cards, merchant dashboard UI
- **Context Sensing** (1 person): `backend/services/weather.py`, `events.py`, `payone.py`, `context.py`, context router
- **Offer Engine** (1 person): `backend/services/offer_engine.py`, offers router, merchants router, Claude prompt engineering
- **Checkout + Integration** (1 person): `backend/services/redemption.py`, redemption router, `models.py`, `types.ts`, `api.ts`, `seed.py`, `nyc.json`
