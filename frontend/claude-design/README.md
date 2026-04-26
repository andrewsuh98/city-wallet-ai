# City Wallet — Design System

> **Real-time offers from the merchants around you.**

City Wallet is an AI-powered local-commerce wallet built on top of DSV-Gruppe (Deutscher Sparkassenverlag) infrastructure — Payone payments, S-Markt merchant relationships, and the regional banking footprint of the Sparkassen. It surfaces a single, perfectly-timed offer to a person on the street, generated dynamically from real-time signals (weather, time, location, transaction density, local events), instead of pushing static coupons that no one wants.

The product centres on a **mobile consumer experience** with a secondary **merchant dashboard**.

---

## Sources

This brand was built from the public hackathon brief at:

- **Repo:** `andrewsuh98/city-wallet-ai` ([README](https://github.com/andrewsuh98/city-wallet-ai/blob/main/README.md), [docs/generative-city-wallet.md](https://github.com/andrewsuh98/city-wallet-ai/blob/main/docs/generative-city-wallet.md))
- **Challenge:** Hack-Nation × World Bank Youth Summit Global AI Hackathon 2026, sponsored by **DSV-Gruppe** (German Savings Banks Financial Group)

There is no pre-existing City Wallet codebase, Figma, or brand guideline. Visual identity here is **invented** to be coherent with the brief's positioning (Sparkassen heritage, European local-commerce, GDPR-by-design, situational warmth) and is anchored in the heritage **Sparkassen-Rot (HKS 13, #E30018)**.

---

## Index — what's in this folder

| Path | What it is |
|---|---|
| `colors_and_type.css` | All foundational tokens — color ramps, semantic vars, type scale, spacing, radii, shadows, motion. Import this into anything you build. |
| `fonts/` | Webfont references. Currently uses Google Fonts (Fraunces, Plus Jakarta Sans, JetBrains Mono); see *Font substitutions* below. |
| `assets/` | Logos, brand marks, illustrations, sample contextual imagery, icon references. |
| `preview/` | Small HTML cards that render in the Design System tab — color swatches, type specimens, components, etc. |
| `ui_kits/consumer/` | Mobile consumer UI kit — JSX components + an interactive `index.html` click-thru. |
| `ui_kits/merchant/` | Merchant dashboard UI kit — JSX components + `index.html`. |
| `SKILL.md` | Cross-compatible Agent Skill manifest so this system can be packaged and used elsewhere. |

---

## Brand at a glance

**Name.** City Wallet. Always two words, title-cased in headings, sentence-case in running copy ("your city wallet"). Never abbreviated to "CW" in user-facing copy.

**Tagline.** *Real-time offers from the merchants around you.*

**Position.** "A living wallet, not a coupon app." Offers don't exist until the moment they're needed.

**Anchor.** Sparkassen-Rot — the most recognisable institutional red in the German consumer landscape. We own a single hue, hard.

---

## Content fundamentals

City Wallet copy is **situational, second-person, warm, and short**. It should sound like a thoughtful local friend who happens to know the weather and what's on at the cafe, not a marketing department.

### Voice rules
- **Second person, present tense.** "Your cappuccino is waiting." Not "Customers can redeem…"
- **Situational over factual when there's a feeling involved.** *"Cold outside? Warm cafe, 80m away."* beats *"15% off at Cafe Mueller."* But the factual version is always the secondary line, never omitted.
- **Specific numbers, plainly.** *"80m away · brewed 4 minutes ago · −20%."* No rounding to feel friendlier.
- **Short sentences. Often fragments.** Lock-screen copy is a haiku, not a paragraph.
- **No exclamation marks.** Ever. Warmth comes from word choice, not punctuation.
- **No emoji in product UI.** Context is shown with iconography (weather, walking-figure, clock). Emoji are reserved for merchant rule-builder examples where the merchant types them themselves.
- **European, not American.** Metric units (m, km, °C). 24-hour time. Euro symbol *after* the number with a thin space (`4,20 €`) when shown to a German-locale user; before with no space (`€4.20`) for English. We do not say "awesome", "rad", "y'all", or "your faves".
- **GDPR-honest.** When data is being used, say what and why, in one sentence. *"Used your location for 4 seconds to find this. Nothing left your phone."*

### Casing
- **Headings & buttons:** Sentence case. *"Accept offer"*, *"Show to cashier"*. Never Title Case Buttons.
- **Eyebrows / chips / metadata:** ALL CAPS, +0.08em tracking, 11px, weight 600. *NEAR YOU · 11:42 · 11°C*.
- **Brand & merchant names:** as the merchant writes them. *Café Müller*, not *Cafe Mueller*.

### Tone examples (good vs. weak)

| Situation | Strong | Weak |
|---|---|---|
| Lock-screen push | *Cold outside? Cappuccino, 80m, −20% until 13:00.* | *🔥 HOT DEAL: Save 20% at Cafe Mueller — limited time* |
| Empty state | *Nothing nearby right now. We'll nudge you when something fits.* | *No offers available at this time.* |
| Privacy disclosure | *Used your location for 4s. It didn't leave the phone.* | *We respect your privacy. See policy.* |
| Merchant rule | *Quiet hours: drop pastries up to −30% Mon–Thu, 14:00–16:00.* | *Configure off-peak promotional discount strategy* |
| Successful redemption | *Done. Café Müller saw it. Enjoy.* | *Transaction successful! Thank you for your purchase 🎉* |
| Offer expiry | *Window closed. The cafe got busy.* | *Offer expired. Try again later.* |

### Word list
- **Yes:** offer, moment, near you, window, accept, show to cashier, redeem, the wallet, quiet hours, fits, nudge.
- **Avoid:** deal, coupon, promo code, voucher, savings, discount\* (use the actual percentage instead — *−20%* is more honest than the word), exclusive, limited-time, hurry, last chance, members only.
  - *\*"Discount" is fine in merchant-side copy where it's the technical term.*

---

## Visual foundations

### Colors
We are a **one-hue brand with a paper-warm neutral**. The red is used sparingly — primary actions, the offer-active state, the logo mark. Everything else is paper, ink, and four small situational accents (warm/cool/fresh/dusk) used only on context chips.

- **Anchor:** `--cw-red-500` (#E30018) — Sparkassen-Rot HKS 13.
- **Surface:** `--cw-paper-50` (#FAF7F2) — never pure white. Warm receipt-paper feel.
- **Ink:** `--cw-paper-900` (#15130F) — never pure black.
- **Situational accents:** sunny `#F59E0B`, rainy `#1E6FB8`, fresh `#2F7D4F`, dusk `#7A4CA8`. Each has a paired tinted background. Used on chips, never on primary surfaces.

### Type
Two voices: **Fraunces** (humanist serif, variable optical-size & softness) for situational/emotional moments — the hero copy on an offer card, the headline on a marketing surface. **Plus Jakarta Sans** for everything UI: buttons, lists, settings, merchant dashboards. **JetBrains Mono** only for token codes, transaction IDs, and the redemption code itself.

The trick: in the consumer app, situational copy is set in Fraunces; data and UI sit in Plus Jakarta Sans. So *"Cold outside?"* is serif, but *"80m · −20% · until 13:00"* is sans. The contrast is the design.

### Spacing & layout
- **4-point grid.** Half-steps (2px) only for hairline-level adjustments inside chips.
- **Mobile content gutter:** 20px (`--space-6`). Consumer app sheets fill the full width of a phone with this gutter.
- **Card stack rhythm:** offer cards are separated by 12px, never by dividers. The paper-warm bg is the divider.
- **Fixed elements:** the consumer app has a single floating capsule navbar at the bottom (Now / Wallet / Map). No top nav on the home view — the offer fills the screen. Status bar always visible, no hiding.
- **Asymmetric balance.** Offer cards lean left-heavy: the hero copy hugs the left edge, the redeem CTA pinned bottom-right. Avoid centred everything.

### Backgrounds & imagery
- **No gradients on chrome.** Solid colors only on UI surfaces.
- **One acceptable gradient:** the "active offer" state on the lock-screen widget — a subtle warm radial from the situational accent towards bottom-right. Soft, never neon.
- **Photography:** warm, slightly grainy, tungsten-tinted. Café interiors with windows fogging. Wet cobblestone. Markt stalls. Avoid stock-photo brightness.
- **Full-bleed:** only the hero of marketing pages and the optional photo on a merchant offer card. App chrome is never full-bleed photography.
- **No hand-drawn illustrations.** No Memphis shapes, no 3D blobs. The only illustration vocabulary is pictographic line icons (see *Iconography*).
- **Receipt texture:** an optional 4% noise overlay on the page background, sized large. It should be felt, not seen.

### Animation & motion
- **Easing default:** `cubic-bezier(0.2, 0.7, 0.2, 1)` — quick out, soft land. Use `--ease-out`.
- **Durations:** 120ms (micro: presses, hover tints), 200ms (default: card hover, fades), 320ms (sheet open), 520ms (offer arrival entrance).
- **No bouncing UI.** One exception: the *"new offer arrived"* card uses a gentle spring (`--ease-spring`) to land — it's the moment we're allowed to celebrate.
- **Fades over slides for state changes.** The wallet is calm, not a casino.
- **No looping animations.** Nothing pulses, nothing spins-forever. Pulses imply urgency, and we don't sell urgency.

### Hover & press states
- **Hover (desktop merchant dashboard):** background steps up by one paper level (e.g. card goes from `--cw-paper-0` → `--cw-paper-50`), no scale, no shadow change. 120ms.
- **Press (everywhere):** scale 0.98, shadow drops one level, an inset 1px shadow appears (`--shadow-press`). 100ms in, 200ms out. Buttons darken to `--action-primary-press`.
- **Focus:** 2px outline in `--cw-red-500` with 2px offset. Never remove focus rings.
- **Disabled:** opacity 0.4, no other treatment.

### Borders & shadows
- **Borders:** hairlines are `rgba(21,19,15,0.08)` — almost imperceptible. We separate by spacing first, hairline second, divider line never.
- **Shadows:** paper-stack only. Soft, low, layered (small + large together). No blue tint, no glow. See `--shadow-1` through `--shadow-4`.
- **Inner shadow:** only on the press state.
- **Capsules vs. protection gradients:** chips with their own background (capsules) are preferred. Protection gradients only when text must overlay full-bleed photography — and only on the marketing site.

### Transparency & blur
- **Backdrop-blur:** the floating bottom capsule navbar uses `backdrop-filter: blur(20px) saturate(140%)` over a `rgba(255,255,255,0.7)` fill. This is the only place blur is used in the consumer app.
- **Otherwise no glassmorphism.** Cards are opaque paper.

### Corner radii — the ticket vocabulary
- 4px: input fields, code chips
- 8px: list rows, buttons
- 12px: standard cards (default)
- 18px: offer cards (the hero)
- 24px: bottom sheets, the wallet itself
- 999px: chips, avatars, the redemption code container

We don't use sharp 0px corners except for the merchant logo lockup (where the merchant's own logo lives).

### Cards
A "card" in City Wallet:
- Has 18px radius (offer) or 12px radius (everything else)
- Has `--shadow-2` resting, `--shadow-3` on hover
- Has 1px hairline at `--border-1` to keep it crisp on the paper bg
- Has 16–20px padding
- **Never has a coloured left-border accent.** That's a pattern we explicitly avoid.

### Layout rules
- The consumer app is a **single-pane mobile experience**, ~390pt wide. Optimise for 390×844 (iPhone 13/14/15).
- Merchant dashboard is desktop-first, 1280px content max-width, sidebar nav 240px.
- Marketing site (out of scope here) would be 1440px max with 80px gutters.

---

## Iconography

**System:** [Phosphor Icons](https://phosphoricons.com/) — *Regular* weight as default, *Bold* weight when an icon is the sole indicator. Phosphor's geometric-but-warm style fits our humanist-serif × clean-grotesque pairing better than the more clinical Heroicons or the more playful Lucide.

> **⚠️ Substitution flag.** Since City Wallet has no existing codebase, we picked Phosphor as a sensible default. If DSV/Sparkassen has a preferred icon system, swap to it before production. The CSS uses `<i class="ph ph-cloud-rain">` patterns — easy to find-and-replace.

**Loading:** Linked from the official CDN in our HTML files:
```html
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css" />
```

**Sizes:** 16px (inline w/ small text), 20px (default UI), 24px (nav, primary), 32px (offer-card context icons). Always pixel-aligned.

**Weather + situational icons:** Phosphor's weather set is rich enough that we don't need a separate weather icon library — `ph-cloud-rain`, `ph-sun`, `ph-cloud-sun`, `ph-snowflake`, `ph-thermometer-cold`, `ph-wind`. Each is paired with one of the four situational accents (cool/warm/cool/cool/cool/cool, etc.).

**Logos & marks:** see `assets/logo.svg` and variants. The mark is a stylised wallet glyph cut from a circle — a coin-like shape that nods to the Sparkassen "S" without copying it.

**Emoji:** explicitly disallowed in product UI. Allowed only inside merchant rule-builder examples (where a merchant might type *"☕ pastries"* into a free-text rule name). Never in copy we author.

**Unicode glyphs as icons:** allowed for typographic moments only — `→` in CTAs, `·` as a metadata separator, `−` (true minus, U+2212) for percentages. Never `*`, `~`, `>`, or arrow-emojis.

**PNG icons:** none. All icons are SVG (Phosphor) or unicode.

---

## Font substitutions — please confirm

City Wallet has no existing font licenses. The current stack uses:

| Role | Family | Why |
|---|---|---|
| Display / situational | **Fraunces** (Google Fonts) | Variable opsz + SOFT axes give us a warm humanist serif that scales from 11px metadata to 60px hero gracefully. |
| UI / body | **Plus Jakarta Sans** (Google Fonts) | Inter's tighter sibling — slightly more characterful at small sizes, still legible. We chose this over plain Inter to lean a touch more European. |
| Mono | **JetBrains Mono** (Google Fonts) | Clear at small sizes, common in fintech for transaction IDs. |

**Ask:** if DSV has licensed display/UI faces (e.g. a brand-house grotesque), please send `.woff2` files and I'll wire them into `/fonts/` and update `colors_and_type.css`.

---

## Caveats

- All visual identity is **invented from the brief**. There is no source-of-truth Figma or codebase. Treat every choice in here as a strong starting point, not a decree.
- The Sparkassen-Rot color is a real heritage value (HKS 13 ≈ #E30018); using it associates City Wallet with the Sparkassen brand family. Confirm with DSV that this association is desired before shipping.
- Phosphor Icons is a substitution — see iconography section.
- No real merchant logos, photography, or sample offer copy from the DSV merchant network has been used. Examples are illustrative.
