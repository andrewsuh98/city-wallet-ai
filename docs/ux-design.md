# UX Design

The challenge states: "Design is not decoration; it is the mechanism of acceptance or rejection." This document addresses the four required UX questions and specifies the key UI components.

---

## The Four Required Questions

### 1. Where does the interaction happen?

**Primary channel: In-app card feed.**

The user opens City Wallet and sees a map with their location and nearby merchants. Below the map is a scrollable feed of offer cards. This is the main interaction surface.

**Why not push notifications?** Push requires native app permissions and aggressive scheduling. For a web app demo, in-app cards are more reliable and controllable. The challenge mentions push as one option among many; the in-app card is the most honest choice for a web-based MVP.

**Secondary channel: Toast notification.**

When a new offer is generated (after the user moves or context changes), a small toast slides up from the bottom of the screen: "New offer nearby: Blue Bottle Coffee." Tapping the toast scrolls the feed to that offer. This simulates the "push notification" experience within the web app.

**Map pins as discovery.**

Merchants with active offers have animated pins on the map. Tapping a pin reveals the offer card for that merchant. This creates a spatial discovery mechanism: the user can see which merchants near them have something to offer.

### 2. How does the offer address the user?

**Default: Emotional-situational.**

The challenge gives two examples:
- Factual: "15% off at Cafe Mueller, 300m away"
- Emotional: "Cold outside? Your cappuccino is waiting."

We default to emotional-situational because it creates connection and context. The Claude prompt is engineered to prefer emotional framing when weather, time, or mood signals are strong. Factual framing is used when the context is neutral (clear weather, normal time, no special signals).

**The `headline_style` field controls this.** Claude returns either "emotional" or "factual" for each offer, and the frontend adjusts typography:
- Emotional headlines: larger font (24px), bolder weight, more vertical space
- Factual headlines: standard weight (18px), with the discount value visually emphasized

**The subtext is always factual.** Regardless of headline style, the subtext includes the concrete details: "15% off at Blue Bottle, 2 min walk." This ensures that even if the emotional headline is vague, the user knows exactly what the offer is within the first 3 seconds.

### 3. What happens in the first 3 seconds?

The OfferCard is designed for instant comprehension. The visual hierarchy:

```
+--------------------------------------------------+
|                                                  |
|  [emoji 48px]          [weather] [2 min walk]    |  <- Context badges (top-right)
|                                                  |
|  Cold outside?                                   |  <- HEADLINE: largest text (24px bold)
|  Your cappuccino is waiting.                     |     The emotional hook. 2 seconds.
|                                                  |
|  15% off at Blue Bottle Coffee                   |  <- SUBTEXT: medium text (16px)
|  Rockefeller Center                              |     The concrete offer. 1 second.
|                                                  |
|  [  Accept  ]                  expires in 23m    |  <- CTA + urgency signal
|                                       [dismiss]  |
|                                                  |
+--------------------------------------------------+
  Background: linear-gradient(135deg, #4A2C2A, #D4A574)
```

**3-second reading path:**
1. **Second 0-1:** Eyes hit the emoji and headline. Large text, warm colors. Emotional hook lands.
2. **Second 1-2:** Eyes drop to subtext. Specific benefit (15% off), merchant name, distance.
3. **Second 2-3:** Eyes find the CTA button. Decision: accept or keep scrolling.

**Design principles for instant comprehension:**
- No scrolling required. The entire offer fits in a single card.
- Maximum two lines for the headline. Overflow is truncated.
- The discount value is numerically prominent (not buried in a sentence).
- Distance is shown as walking time ("2 min walk"), not meters.
- The expiry timer creates gentle urgency without pressure.

### 4. How does the offer end?

Three endings, each designed to feel intentional:

**Acceptance:**
- User taps "Accept"
- Card flashes green briefly, then transitions to show "Accepted!" with a checkmark
- A "Show QR Code" button replaces the Accept button
- Card moves to the Wallet section
- Feels: decisive, rewarding, clear next step

**Dismissal:**
- User swipes the card left or taps the small "dismiss" text
- Card gently fades out and slides off-screen
- A subtle "Offer dismissed" toast appears for 2 seconds with an "Undo" option
- Feels: low-friction, no guilt, reversible

**Expiry:**
- The countdown timer reaches zero
- Card dims slightly, the timer text changes to "Expired"
- After 5 seconds, card fades out
- Feels: natural conclusion, not a penalty

**Decline:**
- User taps "No thanks" (shown on detail view, not the card)
- Card slides down and out
- Feels: explicit but not punitive

---

## Core Components

### OfferCard

The most important component. Implements GenUI by using Claude's `style` output.

**Dynamic styling rules:**

```
Background:      linear-gradient(135deg, style.background_gradient[0], style.background_gradient[1])
Emoji:           Rendered at 48px in the top-left corner
Border radius:   16px
Shadow:          Subtle, depth-appropriate (8px blur, 0.1 opacity)
Padding:         20px
```

**Tone-based animation:**

| Tone | Entry Animation | Duration |
|------|----------------|----------|
| warm | Fade in from 0 opacity | 300ms ease-out |
| urgent | Slide up from bottom + subtle scale pulse | 250ms ease-out + 600ms pulse |
| playful | Bounce in (overshoot spring) | 400ms spring |
| sophisticated | Fade in with 4px blur clearing to sharp | 500ms ease-out |

**Responsive behavior:**
- Mobile (<640px): Full-width card with 16px horizontal margin
- Tablet (640-1024px): 480px max-width, centered
- Desktop (>1024px): 420px max-width, alongside map

### ContextBar

Horizontal strip of badges showing the current context. Gives users transparency into why they are seeing certain offers.

```
[rain 12C]  [Saturday afternoon]  [Broadway Week nearby]  [2 quiet cafes]
```

Each badge is a small pill with an icon and text:
- Weather: cloud/sun icon + temp
- Time: clock icon + "Saturday afternoon"
- Events: calendar icon + event name
- Demand: chart icon + "2 quiet cafes nearby"

Position: fixed at the top of the offer feed, below the map.

### MapView

Mapbox GL map with:
- **User pin:** Blue dot with accuracy circle
- **Merchant pins:** Category-colored markers (brown for cafes, red for restaurants, etc.)
- **Active offer indicators:** Merchants with active offers get an animated pulse ring around their pin
- **Tap interaction:** Tapping a merchant pin scrolls the feed to their offer card
- **Default zoom:** Shows a ~500m radius around the user

### Toast Notification

Slide-up notification when new offers arrive:

```
+------------------------------------------+
|  [emoji] New offer: Blue Bottle Coffee   |
|          Tap to see                      |
+------------------------------------------+
```

- Appears at the bottom of the screen
- Auto-dismisses after 5 seconds
- Tapping scrolls to the offer in the feed
- Stacks if multiple arrive at once (max 2 visible)

### Expiry Timer

Visual countdown on each offer card:

- Full circle progress ring that depletes over time
- Color changes: green (>15 min) -> yellow (5-15 min) -> red (<5 min)
- Text shows minutes remaining: "23m", "4m", "1m"
- When expired: ring disappears, text shows "Expired" in grey

---

## Mobile-First Design

The app is built mobile-first since the use case (person walking through a city with phone in hand) is inherently mobile.

**Viewport layout (mobile):**

```
+----------------------------+
|  [Context Bar]             |  <- Fixed top: weather, time, events
+----------------------------+
|                            |
|       [Map View]           |  <- Top 40% of screen
|       - User location      |
|       - Merchant pins      |
|                            |
+----------------------------+
|                            |
|    [Offer Feed]            |  <- Bottom 60%, scrollable
|    - OfferCard 1           |
|    - OfferCard 2           |
|    - OfferCard 3           |
|                            |
+----------------------------+
|  [Nav: Home | Wallet | ...]|  <- Bottom nav bar
+----------------------------+
```

**The map can be collapsed** by swiping up on the offer feed, giving more room to browse offers. Swiping down re-expands the map.

**Desktop layout:** Side-by-side. Map on the left (60% width), offer feed on the right (40% width). This uses the extra screen real estate without changing the component architecture.

---

## Color Palette

Base palette (Tailwind-compatible):

| Role | Color | Usage |
|------|-------|-------|
| Background | `#0F0F0F` | App background (dark mode) |
| Surface | `#1A1A1A` | Card default background (before gradient) |
| Text primary | `#FFFFFF` | Headlines, CTAs |
| Text secondary | `#A0A0A0` | Subtext, timestamps |
| Accent | `#4F8CFF` | Links, user location dot |
| Success | `#34D399` | Accepted state, redemption confirmation |
| Warning | `#FBBF24` | Expiry warning |
| Danger | `#EF4444` | Expiry critical, errors |

**Dark mode by default.** The offer cards with their Claude-generated gradients pop visually against a dark background. Light mode is not planned for the hackathon.

---

## Typography

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Headline (emotional) | 24px / 1.5rem | 700 (bold) | System font stack |
| Headline (factual) | 20px / 1.25rem | 600 (semi-bold) | System font stack |
| Subtext | 16px / 1rem | 500 (medium) | System font stack |
| Description | 14px / 0.875rem | 400 (normal) | System font stack |
| Badge text | 12px / 0.75rem | 500 (medium) | System font stack |
| CTA button | 16px / 1rem | 600 (semi-bold) | System font stack |

System font stack (`font-sans` in Tailwind) avoids external font loading, which matters for perceived performance.

---

## Consent Modal

Shown on first visit, before requesting geolocation:

```
+------------------------------------------+
|                                          |
|  City Wallet needs your location         |
|  to find offers near you.                |
|                                          |
|  We use your location to:                |
|  - Show merchants within walking dist.   |
|  - Generate offers relevant to where     |
|    you are right now                     |
|                                          |
|  Your location is processed locally.     |
|  Only anonymous context signals are      |
|  sent to our server.                     |
|                                          |
|  [Learn more about privacy]              |
|                                          |
|  [ Enable Location ]    [ Not now ]      |
|                                          |
+------------------------------------------+
```

If the user taps "Not now," the app still works with the default Times Square location. A persistent banner at the top says "Enable location for personalized offers."

---

## Files

| File | Purpose |
|------|---------|
| `frontend/src/components/OfferCard.tsx` | Core offer card with GenUI styling |
| `frontend/src/components/OfferFeed.tsx` | Scrollable offer list |
| `frontend/src/components/MapView.tsx` | Mapbox map with merchant pins |
| `frontend/src/components/ContextBar.tsx` | Context signal badges |
| `frontend/src/components/ConsentModal.tsx` | GDPR consent on first visit |
| `frontend/src/app/page.tsx` | Main consumer page layout |
| `frontend/src/app/wallet/page.tsx` | Wallet page layout |
| `frontend/src/styles/globals.css` | Global styles, dark mode, font stack |
