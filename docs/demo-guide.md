# Demo Guide

## Environment Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- API keys:
  - Anthropic API key (for Claude)
  - OpenWeatherMap API key (free tier)
  - Mapbox access token (free tier)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate       # macOS/Linux
# venv\Scripts\activate        # Windows

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys:
#   ANTHROPIC_API_KEY=sk-ant-...
#   OPENWEATHERMAP_API_KEY=...
#   CITY_CONFIG=nyc

python seed.py                 # Seed merchants and events
uvicorn main:app --reload --port 8000
```

Verify: `http://localhost:8000/docs` should show the FastAPI Swagger UI.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8000/api
#   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...

npm run dev
```

Verify: `http://localhost:3000` should load the app.

---

## Demo Mode

For reliable demos, use the `demo` query parameter to override context with preset scenarios. This ensures consistent, impressive results regardless of actual weather or time.

### Activating Demo Mode

Add `?demo={scenario}` to the app URL:

```
http://localhost:3000?demo=rainy_afternoon
```

The context bar will show a "Demo Mode" badge so judges understand the context is simulated.

### Available Scenarios

| Scenario Key | Weather | Time | Description |
|-------------|---------|------|-------------|
| `rainy_afternoon` | Rain, 11C | Tuesday 2:30 PM | Cafes are quiet, people want warmth. Best for showing the "Mia" scenario from the challenge brief. |
| `hot_weekend` | Clear, 32C | Saturday 12:00 PM | Summer vibes. Ice cream, cold drinks, outdoor seating highlighted. |
| `event_night` | Cloudy, 18C | Friday 7:00 PM | Concert at MSG. Restaurants and bars positioned for pre/post-show crowds. |

### How Demo Mode Works

The frontend passes the `demo` key to `POST /api/context`. The backend returns a preset `ContextState` with hardcoded weather, time, and transaction densities that trigger the best offers. The Claude API call is still real (offers are freshly generated), but the context inputs are controlled.

---

## Demo Script

### Recommended Narrative (3-5 minutes)

**Opening (30 seconds):**

"Meet Mia. She is walking through Midtown Manhattan on a rainy Tuesday afternoon. She has twelve minutes on her lunch break. Her phone knows the weather, it knows which cafes near her are quiet, and it knows there is a festival happening around Times Square. But none of that information is being used. Instead, she gets a generic 10% coupon from an app she downloaded six months ago."

**Show the app. Context bar displays: Rain 11C, Tuesday afternoon, Broadway Week, 3 quiet cafes.**

"City Wallet changes that. It connects all of these real-time signals and generates an offer specifically for this moment."

**Context Sensing Demo (45 seconds):**

"Let me show you what the system sees. These badges at the top are live context signals. It is raining and cold. It is a Tuesday afternoon. Broadway Week is happening nearby. And three cafes within walking distance are having a quiet hour."

**Point to each badge in the context bar.**

"These signals are combined into context tags that trigger the offer engine. Right now, the tags are: rainy, cold, afternoon, weekday, quiet_cafes, event_nearby."

**Offer Generation Demo (60 seconds):**

"Now watch what happens."

**Trigger offer generation (tap refresh or wait for automatic generation).**

"The system just sent these context signals to our offer engine, which uses Claude to generate personalized offers. Each offer is unique to this moment. Look at this one..."

**Expand an offer card.**

"'Cold outside? Your cappuccino is waiting. 15% off at Blue Bottle Coffee, 2 min walk.' This was not retrieved from a database. Claude wrote this headline, chose the warm brown gradient, selected the coffee emoji, and decided on 15% because the cafe is unusually quiet and it is raining."

**Show the 'why now' text: "It is raining and Blue Bottle is unusually quiet for a Tuesday."**

"The merchant only set a rule: 'max 20% discount to fill quiet afternoon hours.' The AI decided the specific offer, the wording, and the visual design."

**Checkout Demo (60 seconds):**

"Let me accept this offer."

**Tap Accept. Show the QR code.**

"I now have a redemption QR code in my wallet. Let me switch to the merchant view."

**Open `/merchant/scan` on a second device or browser tab.**

"The merchant scans my QR code..."

**Scan the QR. Show the validation screen. Tap Confirm.**

"Redeemed. I get $2.40 cashback. The loop is closed: context detection, offer generation, display, acceptance, and simulated checkout."

**Merchant Dashboard (30 seconds):**

"The merchant can see how their offers are performing."

**Show `/merchant` dashboard.**

"47 offers generated, 18 accepted, 14 redeemed. The most effective triggers were rainy weather and quiet periods. They can adjust their rules here."

**Show `/merchant/rules`.**

**Privacy (30 seconds):**

"One more thing. Privacy is built into the architecture, not added as an afterthought."

**Show `/privacy` page with the architecture diagram.**

"In production, a small language model runs on the user's phone and processes their raw location and behavior data locally. Only abstract intent signals leave the device. For the hackathon we simulate this, but the server-side code is identical. There is no user account, no PII, no tracking. The session expires in 24 hours."

**Closing (15 seconds):**

"City Wallet gives local merchants the algorithmic power of e-commerce without sacrificing privacy. Mia gets her cappuccino. Blue Bottle fills a quiet hour. And the Sparkassen network gains a platform that makes the merchant on the corner as responsive to demand as a global marketplace."

---

## Backup Plan

### If Claude API is slow or down

The system has a fallback pool of pre-generated offers. If Claude does not respond within 5 seconds, the fallback kicks in. The offers are less creative but the demo flow still works.

To test fallback: set `ANTHROPIC_API_KEY` to an invalid value.

### If OpenWeatherMap is down

The system defaults to "cloudy, 15C". The offers still generate, just with less weather context.

### If geolocation fails

The app defaults to Times Square (40.7580, -73.9855). A banner says "Using default location." The demo still works.

### If the live demo fails entirely

Record a backup video. Before the demo, do a full run-through and screen-record it. If the live demo has issues, switch to the video: "Let me show you a recording of the full flow we captured earlier."

### Pre-Demo Checklist

- [ ] Backend running (`uvicorn main:app --reload --port 8000`)
- [ ] Frontend running (`npm run dev`)
- [ ] API keys valid (test with curl: `curl http://localhost:8000/api/merchants`)
- [ ] Database seeded (`python seed.py`)
- [ ] Demo mode works (`http://localhost:3000?demo=rainy_afternoon`)
- [ ] QR scan works (test with phone camera or second browser tab)
- [ ] Backup video recorded
- [ ] Phone charged (if using real geolocation)
- [ ] Browser location permission pre-granted
- [ ] Second device ready for merchant scan demo

---

## Local Development Tips

### Hot reload

Both servers support hot reload:
- Backend: `uvicorn main:app --reload` watches for Python file changes
- Frontend: Next.js dev server watches for file changes

### Testing the context endpoint

```bash
curl -X POST http://localhost:8000/api/context \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.7580, "longitude": -73.9855}'
```

### Testing offer generation

```bash
# First get context
CONTEXT=$(curl -s -X POST http://localhost:8000/api/context \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.7580, "longitude": -73.9855}')

# Then generate offers
curl -X POST http://localhost:8000/api/offers/generate \
  -H "Content-Type: application/json" \
  -d "{\"context\": $CONTEXT, \"max_offers\": 3}"
```

### Resetting the database

```bash
cd backend
rm city_wallet.db
python seed.py
```

---

## Files

| File | Purpose |
|------|---------|
| `backend/.env.example` | Template for backend environment variables |
| `frontend/.env.local.example` | Template for frontend environment variables |
| `backend/seed.py` | Database seeding script |
| `docs/demo-guide.md` | This document |
