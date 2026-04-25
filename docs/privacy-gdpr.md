# Privacy and GDPR

The challenge requires teams to "be honest about privacy" and "address GDPR explicitly." This document describes our approach: a simulated on-device SLM architecture with clear consent flows and minimal data collection.

---

## Privacy Architecture

### The On-Device SLM Concept

In production, City Wallet would run a Small Language Model (SLM) directly on the user's device (e.g., Phi-3 Mini, Gemma 2B). This model processes the user's raw location data, movement patterns, and preference history locally. It outputs only abstract "intent signals" that are sent to the server.

```
+-----------------------------------------------------+
|                  USER'S DEVICE                       |
|                                                      |
|  [GPS]  [Movement]  [Preference History]             |
|    |         |              |                        |
|    v         v              v                        |
|  +----------------------------------------+         |
|  |  On-Device SLM (Phi-3 / Gemma)         |         |
|  |  - Classifies intent from raw signals   |         |
|  |  - Runs entirely on-device              |         |
|  |  - No raw data leaves the phone         |         |
|  +-------------------+--------------------+         |
|                      |                               |
|          Abstract intent signals only                |
|          e.g. { "intent": ["warm_drink",             |
|                  "sit_down"],                        |
|                 "preferred_categories":              |
|                  ["cafe", "bakery"] }                |
|                      |                               |
+----------------------+-------------------------------+
                       |
          Only this crosses the network
                       |
                       v
+-----------------------------------------------------+
|                    SERVER                             |
|                                                      |
|  Receives: intent tags + lat/lng                     |
|  Does NOT receive: movement history, raw GPS trace,  |
|    browsing behavior, or personal preferences        |
|                                                      |
|  Combines intent with public context (weather, time, |
|  events, merchant data) to generate offers           |
+-----------------------------------------------------+
```

### What We Build for the Hackathon

The on-device SLM is **simulated**. The frontend sends hardcoded intent signals as if an SLM had classified them:

```typescript
const userPreferences = {
  intent_tags: ["warm_drink", "sit_down"],
  past_categories: ["cafe", "bakery"],
};
```

These are sent alongside the context request. The backend treats them the same way it would treat real SLM output.

The `/privacy` page in the app includes a full architecture diagram explaining how the production system would work with a real on-device SLM.

---

## Data Collection Policy

### What We Collect

| Data | Where Processed | Stored? | Retention |
|------|-----------------|---------|-----------|
| GPS coordinates (lat/lng) | Sent to server per request | Not stored persistently | Discarded after context computation |
| Session ID (UUID) | Frontend localStorage | Server links offers to session | 24 hours, then purged |
| Offer interactions (accept/decline) | Server | Yes, for analytics | Aggregated, not linked to user after 24h |
| Simulated intent tags | Frontend generates, server reads | Not stored | Used only for current request |

### What We Do Not Collect

- Name, email, phone number, or any PII
- Movement history or GPS traces
- Browsing history or app usage patterns
- Device identifiers
- IP addresses (not logged)

### Key Principle: No PII Touches the Server

The session ID is a random UUID. There is no way to link it to a real person. Offer interactions are stored with the session ID for analytics, but after 24 hours the session data is purged and only aggregate counts remain.

---

## Consent Flow

### First Visit

When the user opens City Wallet for the first time:

1. **Consent modal appears** before any geolocation request.
2. The modal explains:
   - What data is collected (location, for offer generation)
   - What is not collected (no PII, no tracking)
   - How data is processed (locally when possible, minimal server data)
   - Link to full privacy page
3. Two choices:
   - **"Enable Location"**: Triggers browser geolocation permission dialog
   - **"Not now"**: App works with default location (Times Square). Banner shows at top: "Enable location for personalized offers."

### Consent Storage

Consent state is stored in `localStorage`:

```typescript
localStorage.setItem("city_wallet_consent", JSON.stringify({
  location_consent: true,
  consent_timestamp: "2026-04-25T14:00:00Z",
  version: "1.0",
}));
```

If consent is revoked (via a "Privacy Settings" link in the app), the session ID is regenerated and all local data is cleared.

---

## GDPR Compliance Measures

### Article 5: Data Minimization

Only the minimum data necessary for offer generation is collected. GPS coordinates are used for a single request and not stored. Intent signals are abstract, not raw behavioral data.

### Article 6: Lawful Basis

**Consent.** The user explicitly opts in to location sharing via the consent modal. Offers are not generated without consent (the app falls back to a default location and generic offers).

### Article 7: Conditions for Consent

Consent is:
- Freely given (the app works without it, just less personalized)
- Specific (for location-based offer generation only)
- Informed (the modal explains what and why)
- Revocable (privacy settings allow revoking at any time)

### Article 17: Right to Erasure

The user can clear their data at any time:
- Clear localStorage (removes session ID, consent, cached offers)
- Server data is automatically purged after 24 hours
- No persistent user profile exists to delete

### Article 25: Data Protection by Design

The architecture is designed for privacy from the ground up:
- On-device SLM processes raw data locally (simulated in hackathon)
- Server only receives abstract intent signals + single GPS coordinate
- Session IDs are random, unlinkable UUIDs
- No cookies, no fingerprinting, no cross-session tracking

---

## Privacy Page Content (`/privacy`)

The app includes a dedicated privacy page at `/privacy` that covers:

1. **Architecture diagram** showing the on-device SLM concept (the diagram from above)
2. **What data we collect** table
3. **How offers are generated** step-by-step, highlighting where data stays local vs goes to server
4. **GDPR compliance** summary
5. **Privacy settings** link to revoke consent and clear data

This page is accessible from:
- The consent modal ("Learn more about privacy" link)
- The app footer/navigation
- The merchant dashboard (merchants need to know their customers' data is protected)

---

## Demo Talking Points

When presenting to judges, emphasize:

1. "We designed for privacy first. The architecture assumes an on-device SLM that processes raw user data locally. Only abstract intent signals leave the phone."

2. "For the hackathon, we simulate the SLM output, but the server-side code is identical. It receives intent tags, not raw data."

3. "There is no user account, no PII, no tracking. The session ID is a random UUID that expires in 24 hours."

4. "The consent flow is explicit: the user understands what data is used and can opt out at any time. The app still works without location consent."

5. "This approach is GDPR-compliant by design, not as an afterthought."

---

## Files

| File | Purpose |
|------|---------|
| `frontend/src/app/privacy/page.tsx` | Privacy explainer page with architecture diagram |
| `frontend/src/components/ConsentModal.tsx` | First-visit consent modal |
| `docs/privacy-gdpr.md` | This document (internal reference) |
