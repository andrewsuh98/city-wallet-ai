# Module 02: Generative Offer Engine

## Purpose

The Generative Offer Engine is the intellectual core of City Wallet. It takes a `ContextState` object and produces dynamically generated, personalized offers. Each offer includes creative content (headline, subtext, description), discount parameters, and visual style hints for GenUI rendering.

This is not template-filling. The merchant sets rules and goals ("max 20% discount to fill quiet hours"). Claude handles the creative execution: writing the copy, choosing the tone, selecting visual style, and deciding the specific discount within the allowed range.

---

## Pipeline

```
ContextState
    |
    v
[1. Merchant Matching]  -- filter by proximity, rules, triggers
    |
    v
[2. Prompt Construction]  -- build structured prompt for Claude
    |
    v
[3. Claude API Call]  -- single call, JSON response
    |
    v
[4. Post-Processing]  -- validate, assign tokens, store
    |
    v
Offer[]
```

---

## Step 1: Merchant Matching

**Implementation:** First half of `backend/services/offer_engine.py`

Filter the merchant list to find those eligible for offer generation right now.

**Filters (applied in order):**

1. **Proximity:** Merchant must be within 500m of user location (configurable via `default_radius_meters`).

2. **Active time window:** Current time must fall within at least one of the merchant's rules' `active_hours_start` / `active_hours_end` range.

3. **Trigger match:** At least one of the rule's `trigger_conditions` must appear in the context's `context_tags`. Example: rule has `["quiet_period", "rainy"]`, context has `["rainy", "afternoon", "weekday"]` = match on "rainy".

4. **Daily budget:** The merchant has not exceeded `max_offers_per_day` for today.

**Output:** 3-8 eligible merchants with their matching rules. If fewer than 2 merchants match, relax the trigger condition filter (allow partial matches or time-only matches).

---

## Step 2: Prompt Construction

**Implementation:** `build_claude_prompt()` in `backend/services/offer_engine.py`

The prompt has three parts: system prompt, context block, and merchant block.

### System Prompt

```
You are the City Wallet offer engine. You generate hyper-personalized,
context-aware offers for local merchants. Your job is to create offers
that feel crafted for this exact moment, not generic discounts.

Rules:
- Each offer must be understood in 3 seconds
- Headlines: max 8 words, prefer emotional-situational framing
- Subtext: max 15 words, include distance and specific benefit
- Description: 2-3 sentences for the detail view
- Choose a discount within the merchant's allowed range
- Each offer should feel unique and different from the others
- Match your tone to the context (rain = cozy/warm, hot = refreshing, etc.)

Output format: Return a JSON array of offer objects. No markdown, no
explanation, just the JSON array.
```

### Context Block

```
CURRENT CONTEXT:
- Weather: light rain, 12.5C, humidity 85%
- Time: Saturday afternoon (2:30 PM)
- Location: Near Times Square, Midtown Manhattan
- Nearby events: Broadway Week Spring 2026 (festival, ~50000 expected)
- Overall vibe: Rainy weekend afternoon, several cafes are quiet, event crowds nearby
- Urgency: 0.7 (moderate-high: rain + quiet merchants = fleeting opportunity)
```

### Merchant Block

```
ELIGIBLE MERCHANTS (generate one offer per merchant):

1. Blue Bottle Coffee (cafe)
   Distance: 180m from user
   Current traffic: quiet (density ratio 0.32, normally 25 txns/hr, now 8)
   Merchant goal: "Fill quiet afternoon hours with walk-in traffic"
   Discount range: 10-20% (percentage discount)
   Max budget today: $50 remaining

2. Joe's Pizza (restaurant)
   Distance: 250m from user
   Current traffic: normal (density ratio 0.95)
   Merchant goal: "Rainy day lunch specials to maintain foot traffic"
   Discount range: 5-15% (percentage discount)
   Max budget today: $40 remaining

3. The Strand Bookstore (bookstore)
   Distance: 420m from user
   Current traffic: quiet (density ratio 0.41)
   Merchant goal: "Weekend browse-and-buy incentive"
   Discount range: 10-20% (percentage discount or free item)
   Max budget today: $30 remaining

For each offer, return:
{
  "merchant_id": "m_001",
  "headline": "max 8 words, emotional preferred",
  "subtext": "max 15 words, include distance",
  "description": "2-3 sentences for detail view",
  "discount_value": "specific discount, e.g. 15%",
  "discount_type": "percentage_discount | fixed_amount | free_item | bogo",
  "why_now": "1 sentence: why THIS moment matters",
  "style": {
    "background_gradient": ["#hex1", "#hex2"],
    "emoji": "single relevant emoji character",
    "tone": "warm | urgent | playful | sophisticated",
    "headline_style": "emotional | factual"
  },
  "expires_in_minutes": 15-60
}
```

### Prompt Engineering Notes

- Include the merchant's `goal` text verbatim. Claude uses it to frame the offer's purpose.
- Include the density ratio and trend. Claude uses "quiet" merchants to create urgency-based copy.
- Include distance in meters. Claude includes it in the subtext.
- Include the discount range, not a fixed value. Claude picks the specific discount based on context (more aggressive in bad weather or very quiet periods).
- Request JSON only, no markdown wrapping. This simplifies parsing.

---

## Step 3: Claude API Call

**Implementation:** `call_claude()` in `backend/services/offer_engine.py`

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=2000,
    temperature=0.8,
    system=SYSTEM_PROMPT,
    messages=[
        {"role": "user", "content": user_prompt}
    ],
)

raw_json = response.content[0].text
offers_data = json.loads(raw_json)
```

**Model choice:** Claude Sonnet for speed. Offer generation should complete in under 3 seconds. Opus produces marginally better copy but at 3-5x the latency. For a real-time demo, Sonnet is the right tradeoff.

**Temperature:** 0.8 for creative variety. Each generation should feel fresh. Lower temperatures produce repetitive headlines.

**Max tokens:** 2000 is sufficient for 3-5 offers with full metadata.

**Timeout:** 5 seconds. If Claude does not respond within 5 seconds, fall back to pre-generated offers.

### Fallback Strategy

Maintain a small pool of 5-8 pre-generated offers in `backend/services/fallback_offers.json`. These are generic but plausible ("Take a break. 15% off nearby"). If Claude fails:
1. Log the error
2. Select 2-3 fallback offers matching the current context_tags
3. Adjust distance and merchant name to match eligible merchants
4. Return as if generated

The frontend should not show any error. The user experience must be seamless.

---

## Step 4: Post-Processing

**Implementation:** `process_claude_response()` in `backend/services/offer_engine.py`

After receiving Claude's JSON response:

1. **Parse and validate:** Ensure each offer has all required fields. Use Pydantic to validate.

2. **Enforce merchant rules:**
   - Discount must be within `min_discount_percent` to `max_discount_percent`
   - If Claude exceeded the range, clamp to the max
   - Offer type must match the allowed `offer_type`

3. **Assign IDs:** Generate UUID for each offer (`off_` prefix + hex)

4. **Assign redemption tokens:** Not yet. Tokens are generated when the user accepts.

5. **Compute expiry:** `created_at + expires_in_minutes` from Claude's response. Clamp to 15-60 minutes.

6. **Calculate distance:** Haversine formula between user location and merchant location.

7. **Store in SQLite:** Insert each offer into the `offers` table with `status = "active"` and the user's `session_id`.

8. **Return:** List of `Offer` objects to the API response.

---

## Merchant Rule Engine

Merchants control offer generation through rules. They do not write the offer copy or choose the visual design. They set boundaries and goals.

### Rule Fields

| Field | What the merchant controls |
|-------|---------------------------|
| `max_discount_percent` | "I will never give more than 20% off" |
| `min_discount_percent` | "Offers should be at least 5% to feel meaningful" |
| `active_hours_start/end` | "Only generate offers between 1 PM and 5 PM" |
| `trigger_conditions` | "Only when it is raining OR my shop is quiet" |
| `goal` | Free text: "Fill quiet afternoon hours." Claude reads this. |
| `max_offers_per_day` | "Do not generate more than 15 offers today" |
| `offer_type` | "Percentage discount only" (or fixed_amount, bogo, free_item) |
| `budget_daily_usd` | "Do not exceed $50 in discounts today" |

### Merchant Rule Interface

The frontend provides a form at `/merchant/rules` where merchants can set these parameters. For the hackathon, this is functional but simple:
- Sliders for discount range
- Time picker for active hours
- Checkbox list for trigger conditions
- Text area for the goal description
- Number inputs for max offers and budget

The rule editor is a required deliverable (the challenge says "Show the merchant-side rule interface, even as a mockup").

---

## GenUI Style System

Claude generates visual style hints for each offer. The frontend interprets these hints to render unique cards.

### Style Fields

| Field | Values | Frontend Interpretation |
|-------|--------|----------------------|
| `background_gradient` | Two hex colors | CSS `linear-gradient(135deg, color1, color2)` |
| `emoji` | Single emoji | Displayed at 48px as a decorative element in the card |
| `tone` | warm, urgent, playful, sophisticated | Controls animation and typography weight |
| `headline_style` | emotional, factual | Emotional = larger, bolder headline. Factual = standard weight with data emphasis. |

### Tone to Visual Mapping

| Tone | Animation | Font Weight | Color Temperature |
|------|-----------|-------------|-------------------|
| warm | Gentle fade-in (300ms) | Semi-bold | Warm gradients (browns, oranges, ambers) |
| urgent | Slide-up with subtle pulse | Bold | High-contrast (reds, dark backgrounds) |
| playful | Bounce-in | Medium | Bright, saturated (yellows, greens, purples) |
| sophisticated | Slow fade with blur-clear | Light | Muted, dark (navy, charcoal, gold accents) |

This mapping is implemented in the frontend `OfferCard.tsx` component. Claude only returns the semantic tone; the frontend decides the specific CSS.

---

## Example Generated Offer

**Context:** Rainy Saturday afternoon, Blue Bottle Coffee is quiet, user is near Times Square.

**Claude's output:**

```json
{
  "merchant_id": "m_001",
  "headline": "Cold outside? Your cappuccino is waiting.",
  "subtext": "15% off at Blue Bottle Coffee, 2 min walk",
  "description": "Warm up with a handcrafted cappuccino at Blue Bottle Coffee. Their Rockefeller Center location is quiet right now, and you can grab a table by the window to watch the rain.",
  "discount_value": "15%",
  "discount_type": "percentage_discount",
  "why_now": "It's raining and Blue Bottle is unusually quiet for a Saturday. Perfect time to warm up with a coffee.",
  "style": {
    "background_gradient": ["#4A2C2A", "#D4A574"],
    "emoji": "coffee",
    "tone": "warm",
    "headline_style": "emotional"
  },
  "expires_in_minutes": 25
}
```

---

## Files

| File | Purpose |
|------|---------|
| `backend/services/offer_engine.py` | Merchant matching, prompt construction, Claude call, post-processing |
| `backend/routers/offers.py` | POST /api/offers/generate, GET /api/offers, PATCH /api/offers/{id} |
| `backend/routers/merchants.py` | GET/PUT merchant rules, GET analytics |
| `frontend/src/components/OfferCard.tsx` | GenUI rendering with style hints |
| `frontend/src/app/merchant/rules/page.tsx` | Merchant rule editor form |
