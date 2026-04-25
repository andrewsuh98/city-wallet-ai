import type {
  ContextRequest,
  ContextState,
  GenerateOffersRequest,
  GenerateOffersResponse,
  Merchant,
  MerchantRule,
  Offer,
  OfferActionRequest,
  OfferAnalytics,
  RedemptionResult,
  TokenValidationResponse,
  WalletRedemption,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// Context

export async function getContext(
  req: ContextRequest,
  demo?: string,
): Promise<ContextState> {
  const path = demo ? `/context?demo=${encodeURIComponent(demo)}` : "/context";
  return request(path, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// Offers

export async function generateOffers(
  req: GenerateOffersRequest,
): Promise<GenerateOffersResponse> {
  return request("/offers/generate", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getOffers(
  sessionId: string,
): Promise<{ offers: Offer[] }> {
  return request(`/offers?session_id=${encodeURIComponent(sessionId)}`);
}

export async function updateOffer(
  offerId: string,
  action: OfferActionRequest,
): Promise<{ offer: Offer }> {
  return request(`/offers/${encodeURIComponent(offerId)}`, {
    method: "PATCH",
    body: JSON.stringify(action),
  });
}

// Merchants

export async function getMerchants(): Promise<{ merchants: Merchant[] }> {
  return request("/merchants");
}

export async function getMerchant(id: string): Promise<Merchant> {
  return request(`/merchants/${encodeURIComponent(id)}`);
}

export async function getMerchantRules(
  id: string,
): Promise<{ rules: MerchantRule[] }> {
  return request(`/merchants/${encodeURIComponent(id)}/rules`);
}

export async function updateMerchantRules(
  id: string,
  rules: MerchantRule[],
): Promise<{ rules: MerchantRule[] }> {
  return request(`/merchants/${encodeURIComponent(id)}/rules`, {
    method: "PUT",
    body: JSON.stringify({ rules }),
  });
}

export async function getMerchantAnalytics(
  id: string,
): Promise<OfferAnalytics> {
  return request(`/merchants/${encodeURIComponent(id)}/analytics`);
}

// Redemption

export async function redeemOffer(
  offerId: string,
  token: string,
): Promise<RedemptionResult> {
  return request("/redeem", {
    method: "POST",
    body: JSON.stringify({ offer_id: offerId, token }),
  });
}

export async function validateToken(
  token: string,
): Promise<TokenValidationResponse> {
  return request(`/redeem/validate/${encodeURIComponent(token)}`);
}

export async function getOfferQR(offerId: string): Promise<{
  qr_base64: string;
  token: string;
  expires_at: string;
}> {
  return request(`/redeem/qr/${encodeURIComponent(offerId)}`);
}

export async function getWalletBalance(sessionId: string): Promise<{
  balance_usd: number;
  redemption_count: number;
  redemptions: WalletRedemption[];
}> {
  return request(`/wallet/${encodeURIComponent(sessionId)}`);
}
