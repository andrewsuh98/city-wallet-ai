# Module 03: Checkout and Redemption

## Purpose

The Checkout and Redemption module closes the loop. When a user accepts an offer, they receive a redemption token encoded as a QR code. The merchant scans the QR code to validate and redeem it. The module also powers the merchant analytics dashboard.

The challenge requires demonstrating the "end-to-end flow from offer generation to simulated redemption." This module is what makes the difference between a prototype and a demo.

---

## Redemption Flow

```
User sees offer
    |
    v
[Accept] -- PATCH /api/offers/{id} { action: "accept" }
    |
    v
Backend assigns redemption_token (UUID v4)
Offer status -> "accepted"
    |
    v
User navigates to /redeem/{offer_id}
Frontend displays QR code encoding: {base_url}/api/redeem/validate/{token}
    |
    v
Merchant opens /merchant/scan on their device
Camera scans QR code
    |
    v
Frontend calls GET /api/redeem/validate/{token}
Shows offer details + "Confirm Redemption" button
    |
    v
Merchant taps "Confirm Redemption"
Frontend calls POST /api/redeem { offer_id, token }
    |
    v
Backend validates token, marks offer as "redeemed"
Creates redemption record, computes cashback
    |
    v
Both sides see confirmation:
  Consumer: "Redeemed! $2.40 cashback applied."
  Merchant: "Redemption confirmed. Offer #off_a1b2c3 complete."
```

---

## Token Lifecycle

| State | Description |
|-------|-------------|
| **No token** | Offer is active, not yet accepted. `redemption_token` is null. |
| **Token assigned** | User accepted the offer. A UUID v4 token is generated and stored in the `offers` table. Status = "accepted". |
| **Token validated** | Merchant scanned the QR and previewed the offer. No state change. |
| **Token redeemed** | Merchant confirmed redemption. Status = "redeemed". A record is created in the `redemptions` table. Token cannot be reused. |
| **Token expired** | Offer expired before redemption. Status = "expired". Token is invalidated. |

### Token Security

For a hackathon, UUID v4 tokens provide sufficient uniqueness and unpredictability. In production, you would add:
- HMAC signing to prevent token forgery
- Rate limiting on validation endpoint
- Time-based expiry enforcement on the server

---

## QR Code Generation

**Implementation:** `backend/services/redemption.py`

The QR code is generated server-side using Python's `qrcode` library and returned as a base64-encoded PNG.

```python
import qrcode
import io
import base64

def generate_qr_code(token: str, base_url: str) -> str:
    """Generate a QR code that encodes the validation URL."""
    url = f"{base_url}/api/redeem/validate/{token}"
    qr = qrcode.make(url)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")
```

The frontend displays this as:
```html
<img src={`data:image/png;base64,${qr_base64}`} alt="Redemption QR Code" />
```

### What the QR Encodes

The QR code contains a URL:
```
http://localhost:8000/api/redeem/validate/a7f3b2c1-4d5e-6f7a-8b9c-0d1e2f3a4b5c
```

When the merchant scans this with their phone camera (or the in-app scanner), it opens the validation endpoint. The merchant dashboard at `/merchant/scan` uses a camera-based QR scanner component that reads this URL, extracts the token, and calls the validation API.

---

## Consumer Views

### Offer Accept Flow

When the user taps "Accept" on an `OfferCard`:

1. `PATCH /api/offers/{id}` with `{ action: "accept" }`
2. Response includes `redemption_token`
3. Offer card animates to show "Accepted!" state
4. Card displays a "Show QR Code" button
5. Tapping navigates to `/redeem/{offer_id}`

### Redemption Page (`/redeem/{offer_id}`)

Displays:
- Large QR code (centered, easily scannable)
- Offer headline and merchant name
- Discount value
- Expiry countdown timer (animated ring or progress bar)
- "Show to merchant to redeem" instruction text
- Back button to wallet

### Wallet Page (`/wallet`)

Lists all accepted and redeemed offers:
- Accepted offers show QR code button + expiry timer
- Redeemed offers show "Redeemed" badge + cashback amount
- Expired offers show "Expired" badge (greyed out)

---

## Merchant Views

### QR Scanner Page (`/merchant/scan`)

Full-screen camera view with QR scanning overlay.

**Implementation:** Use `html5-qrcode` library or `@zxing/browser` for browser-based QR scanning.

**Flow:**
1. Camera opens with scanning frame overlay
2. When QR is detected, extract the token from the URL
3. Call `GET /api/redeem/validate/{token}`
4. Display offer details: customer's offer headline, discount, merchant name
5. Show "Confirm Redemption" button
6. On confirm, call `POST /api/redeem { offer_id, token }`
7. Show success confirmation with cashback amount

### Merchant Dashboard (`/merchant`)

Overview of offer performance. Required by the challenge as a deliverable.

**Displays:**
- Total offers generated, accepted, declined, redeemed
- Acceptance rate (accepted / (accepted + declined)) as a percentage
- Redemption rate (redeemed / accepted) as a percentage
- Top context triggers (which tags most commonly triggered offers)
- Revenue impact estimate (total cashback disbursed)
- Time-series chart of offers over the past 24 hours (if time permits)

**Data source:** `GET /api/merchants/{id}/analytics`

For the hackathon, the analytics can be computed from the offers table on the fly (no need for a separate analytics pipeline). A simple SQL query counts offers by status for a given merchant_id.

```sql
SELECT
    COUNT(*) as total_generated,
    SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as total_accepted,
    SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as total_declined,
    SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as total_expired,
    SUM(CASE WHEN status = 'redeemed' THEN 1 ELSE 0 END) as total_redeemed
FROM offers
WHERE merchant_id = ?;
```

---

## Cashback Mechanic

The challenge mentions cashback as an alternative to QR-based discount. Our approach: after a successful QR redemption, the customer receives a "cashback credit" equal to the discount amount.

**Calculation:**

The cashback is a display-only value for the demo. In production, it would integrate with a payments system.

```python
def compute_cashback(offer: Offer, assumed_order_total: float = 15.00) -> float:
    """Estimate cashback based on discount and an assumed order total."""
    if offer.discount_type == "percentage_discount":
        pct = float(offer.discount_value.replace("%", "")) / 100
        return round(assumed_order_total * pct, 2)
    elif offer.discount_type == "fixed_amount":
        return float(offer.discount_value.replace("$", "").strip())
    return 0.0
```

The assumed order total ($15.00) is a reasonable default for a cafe or quick-service restaurant. In production, the actual POS transaction amount would be used.

---

## Offer Status Transitions

```
                 +---> declined (user tapped "No thanks")
                 |
active ---+------+---> expired (time ran out)
          |
          +---> accepted ---+---> expired (time ran out before merchant scan)
                            |
                            +---> redeemed (merchant confirmed)
```

**Dismissed vs Declined:** "Dismiss" means the user swiped away without explicit rejection (softer signal). "Decline" means the user tapped "No thanks" (explicit rejection). Both are tracked for analytics.

---

## Files

| File | Purpose |
|------|---------|
| `backend/services/redemption.py` | Token generation, QR code creation, validation, redemption |
| `backend/routers/redemption.py` | POST /api/redeem, GET /api/redeem/validate/{token} |
| `frontend/src/app/redeem/[id]/page.tsx` | Consumer QR code display page |
| `frontend/src/app/wallet/page.tsx` | Consumer wallet (accepted/redeemed offers) |
| `frontend/src/app/merchant/page.tsx` | Merchant dashboard with analytics |
| `frontend/src/app/merchant/scan/page.tsx` | Merchant QR scanner |
| `frontend/src/components/QRCode.tsx` | QR code display component |
| `frontend/src/components/QRScanner.tsx` | Camera-based QR scanning component |
| `frontend/src/components/PerformanceChart.tsx` | Analytics chart for merchant dashboard |
