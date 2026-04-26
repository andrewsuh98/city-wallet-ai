import type {
  ContextRequest,
  ContextState,
  GenerateOffersRequest,
  GenerateOffersResponse,
  Merchant,
  MerchantRule,
  MerchantDashboardStats,
  Offer,
  OfferActionRequest,
  OfferAnalytics,
  RedemptionResult,
  RulesPatchRequest,
  TokenValidationResponse,
  WalletRedemption,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// Context

export async function getContext(
  req: ContextRequest,
  demoMode?: string | null,
): Promise<ContextState> {
  const path = demoMode ? `/context?demo=${encodeURIComponent(demoMode)}` : "/context";
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

// Static mock series — deterministic so charts don't flicker on re-render.
// TODO: replace getMerchantDashboard with real endpoint GET /merchants/{id}/dashboard
const MOCK_DAILY_REDEMPTIONS = [5, 8, 3, 12, 9, 4, 7, 11, 6, 10, 8, 5, 3, 9, 14, 7, 6, 8, 10, 9, 5, 7, 12, 8, 4, 6, 9, 11, 7, 8];
const MOCK_HOURLY_COUNTS     = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 3, 2, 2, 3, 4, 3, 2, 1, 1, 0, 0];

export async function getMerchantDashboard(
  id: string
): Promise<MerchantDashboardStats> {
  // Mock data for frontend prototype
  return new Promise(resolve => setTimeout(() => {
    resolve({
      merchant_id: id,
      period_days: 30,
      incremental_revenue_usd: 1250,
      total_redemptions: 145,
      avg_ticket_usd: 24.5,
      avg_discount_pct: 15.2,
      campaign_active: true,
      is_paused: false,
      strategy: "autopilot",
      max_discount_percent: 25,
      min_spend_usd: 15,
      max_offers_per_day: 15,
      total_generated: 1200,
      total_accepted: 350,
      acceptance_rate: 350 / 1200,
      redemption_rate: 145 / 1200,
      daily_series: MOCK_DAILY_REDEMPTIONS.map((redemptions, i) => {
        const d = new Date("2026-03-27");
        d.setDate(d.getDate() + i);
        return {
          date: d.toISOString().split("T")[0],
          redemptions,
          revenue_usd: Math.round(redemptions * 24.5),
          avg_discount_pct: 15.2,
        };
      }),
      hourly_redemptions: MOCK_HOURLY_COUNTS.map((count, hour) => ({ hour, count })),
      dead_hour_ranges: [[14, 17]],
      top_context_triggers: ["rainy_day", "quiet_period", "cold_weather"],
    });
  }, 500));
}

// TODO: replace patchMerchantCampaign with real endpoint PATCH /merchants/{id}/campaign
export async function patchMerchantCampaign(
  id: string,
  paused: boolean
): Promise<{ is_paused: boolean }> {
  return new Promise(resolve => setTimeout(() => resolve({ is_paused: paused }), 500));
}

// TODO: replace patchMerchantRules with real endpoint PATCH /merchants/{id}/rules
export async function patchMerchantRules(
  id: string,
  updates: RulesPatchRequest
): Promise<{ success: boolean }> {
  return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
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
