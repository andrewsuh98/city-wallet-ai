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

export async function getContext(req: ContextRequest): Promise<ContextState> {
  return request("/context", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// Offers

export async function generateOffers(
  req: GenerateOffersRequest
): Promise<GenerateOffersResponse> {
  return request("/offers/generate", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getOffers(sessionId: string): Promise<{ offers: Offer[] }> {
  return request(`/offers?session_id=${encodeURIComponent(sessionId)}`);
}

export async function updateOffer(
  offerId: string,
  action: OfferActionRequest
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
  id: string
): Promise<{ rules: MerchantRule[] }> {
  return request(`/merchants/${encodeURIComponent(id)}/rules`);
}

export async function updateMerchantRules(
  id: string,
  rules: MerchantRule[]
): Promise<{ rules: MerchantRule[] }> {
  return request(`/merchants/${encodeURIComponent(id)}/rules`, {
    method: "PUT",
    body: JSON.stringify({ rules }),
  });
}

export async function getMerchantAnalytics(
  id: string
): Promise<OfferAnalytics> {
  return request(`/merchants/${encodeURIComponent(id)}/analytics`);
}

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
      total_generated: 1200,
      total_accepted: 350,
      acceptance_rate: 350 / 1200,
      redemption_rate: 145 / 1200,
      daily_series: Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
          date: d.toISOString().split("T")[0],
          redemptions: Math.floor(Math.random() * 10) + 1,
          revenue_usd: Math.floor(Math.random() * 100) + 50,
          avg_discount_pct: 10 + Math.random() * 10,
        };
      }),
      hourly_redemptions: Array.from({ length: 24 }).map((_, i) => ({
        hour: i,
        count: (i > 8 && i < 22) ? Math.floor(Math.random() * 5) : 0,
      })),
      dead_hour_ranges: [[14, 17]],
      top_context_triggers: ["rainy_day", "quiet_period", "cold_weather"],
    });
  }, 500));
}

export async function patchMerchantCampaign(
  id: string,
  paused: boolean
): Promise<{ is_paused: boolean }> {
  return new Promise(resolve => setTimeout(() => resolve({ is_paused: paused }), 500));
}

export async function patchMerchantRules(
  id: string,
  updates: RulesPatchRequest
): Promise<{ success: boolean }> {
  return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
}

// Redemption

export async function redeemOffer(
  offerId: string,
  token: string
): Promise<RedemptionResult> {
  return request("/redeem", {
    method: "POST",
    body: JSON.stringify({ offer_id: offerId, token }),
  });
}

export async function validateToken(
  token: string
): Promise<TokenValidationResponse> {
  return request(`/redeem/validate/${encodeURIComponent(token)}`);
}
