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

export interface MerchantLiveSignal {
  merchant_id: string;
  recent_txns_60min: number[];
  inventory_flags: string[];
  staff_capacity: "low" | "normal" | "high";
  daily_budget_burned_pct: number;
  active_offer_count: number;
}

export interface CustomerIntent {
  intent_tags: string[];
  preferred_categories: string[];
  price_sensitivity?: "low" | "mid" | "high" | null;
  movement_state?: "stationary" | "walking" | "transit" | null;
  session_dwell_seconds?: number | null;
  declined_categories_today: string[];
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
  merchant_live_signals: MerchantLiveSignal[];
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
  brand_voice: string | null;
  signature_items: string[];
  target_demographics: string[];
  primary_goal: string | null;
  daily_budget_usd: number | null;
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
  tone: "warm" | "urgent" | "playful" | "sophisticated";
  headline_style: "emotional";
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

// Request / Response types

export interface ContextRequest {
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
}

export interface GenerateOffersRequest {
  session_id: string;
  context: ContextState;
  max_offers?: number;
  customer_intent?: CustomerIntent;
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
