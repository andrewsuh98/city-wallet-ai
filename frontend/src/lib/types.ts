// Context types

export type WeatherCondition = "clear" | "cloudy" | "rain" | "snow" | "storm";

export interface WeatherData {
  condition: WeatherCondition;
  temp_celsius: number;
  humidity: number;
  description: string;
}

export interface EventData {
  id: string;
  name: string;
  venue: string;
  category: string;
  start_time: string;
  end_time: string | null;
  latitude: number;
  longitude: number;
  expected_attendance: number | null;
}

export interface TransactionDensity {
  merchant_id: string;
  current_hour_txns: number;
  avg_hour_txns: number;
  density_ratio: number;
  trend: "quiet" | "normal" | "busy" | "surging";
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
}

export interface ContextState {
  timestamp: string;
  location: UserLocation;
  weather: WeatherData;
  time_of_day: string;
  day_of_week: string;
  is_weekend: boolean;
  nearby_events: EventData[];
  merchant_densities: TransactionDensity[];
  context_tags: string[];
  urgency_score: number;
}

// Merchant types

export type MerchantCategory =
  | "cafe"
  | "restaurant"
  | "retail"
  | "bakery"
  | "bar"
  | "bookstore"
  | "grocery"
  | "fitness";

export interface MerchantRule {
  id: string | null;
  merchant_id: string;
  max_discount_percent: number;
  min_discount_percent: number;
  active_hours_start: string;
  active_hours_end: string;
  trigger_conditions: string[];
  goal: string;
  max_offers_per_day: number;
  offer_type: string;
  budget_daily_usd: number | null;
}

export interface Merchant {
  id: string;
  name: string;
  category: MerchantCategory;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  image_url: string | null;
  rules: MerchantRule[];
}

// Offer types

export type OfferStatus =
  | "active"
  | "accepted"
  | "declined"
  | "expired"
  | "redeemed";

export interface OfferStyle {
  background_gradient: string[];
  emoji: string;
  tone: "warm" | "urgent" | "playful" | "sophisticated";
  headline_style: "emotional" | "factual";
}

export interface Offer {
  id: string;
  merchant_id: string;
  merchant_name: string;
  merchant_category: MerchantCategory;
  headline: string;
  subtext: string;
  description: string;
  discount_value: string;
  discount_type: string;
  context_tags: string[];
  why_now: string;
  created_at: string;
  expires_at: string;
  style: OfferStyle;
  status: OfferStatus;
  distance_meters: number | null;
  redemption_token: string | null;
}

// Redemption types

export interface RedemptionResult {
  success: boolean;
  offer: Offer;
  message: string;
  cashback_amount: number | null;
}

// Analytics types

export interface OfferAnalytics {
  merchant_id: string;
  total_generated: number;
  total_accepted: number;
  total_declined: number;
  total_expired: number;
  total_redeemed: number;
  acceptance_rate: number;
  redemption_rate: number;
  top_context_triggers: string[];
  revenue_impact_estimate: number;
}

export interface DailyMetric {
  date: string;
  redemptions: number;
  revenue_usd: number;
  avg_discount_pct: number;
}

export interface HourlyRedemption {
  hour: number;
  count: number;
}

export interface MerchantDashboardStats {
  merchant_id: string;
  period_days: number;
  incremental_revenue_usd: number;
  total_redemptions: number;
  avg_ticket_usd: number;
  avg_discount_pct: number;
  campaign_active: boolean;
  is_paused: boolean;
  strategy: string;
  max_discount_percent: number;
  min_spend_usd: number;
  total_generated: number;
  total_accepted: number;
  acceptance_rate: number;
  redemption_rate: number;
  daily_series: DailyMetric[];
  hourly_redemptions: HourlyRedemption[];
  dead_hour_ranges: [number, number][];
  top_context_triggers: string[];
}

export interface CampaignPatchRequest {
  paused: boolean;
}

export interface RulesPatchRequest {
  max_discount_percent?: number;
  min_spend_usd?: number;
  goal?: string;
}

// Request / Response types

export interface ContextRequest {
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
}

export interface GenerateOffersRequest {
  context: ContextState;
  max_offers?: number;
  user_preferences?: {
    intent_tags?: string[];
    past_categories?: string[];
  };
}

export interface GenerateOffersResponse {
  offers: Offer[];
  generation_time_ms: number;
  context_summary: string;
}

export interface OfferActionRequest {
  action: "accept" | "decline" | "dismiss";
}

export interface TokenValidationResponse {
  valid: boolean;
  offer: Offer | null;
  merchant_name: string | null;
}
