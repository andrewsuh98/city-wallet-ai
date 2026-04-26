from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from typing import Optional


# --- Context ---

class WeatherCondition(str, Enum):
    CLEAR = "clear"
    CLOUDY = "cloudy"
    RAIN = "rain"
    SNOW = "snow"
    STORM = "storm"


class WeatherData(BaseModel):
    condition: WeatherCondition
    temp_celsius: float
    humidity: int
    description: str


class EventData(BaseModel):
    id: str
    name: str
    venue: str
    category: str
    start_time: datetime
    end_time: Optional[datetime] = None
    latitude: float
    longitude: float
    expected_attendance: Optional[int] = None


class TransactionDensity(BaseModel):
    merchant_id: str
    current_hour_txns: int
    avg_hour_txns: float
    density_ratio: float
    trend: str


class MerchantLiveSignal(BaseModel):
    """Continuously-polled merchant state (simulated). Distinct from density:
    density is a single ratio for the current hour, this is the richer
    operating state used by Claude to ground offer copy.
    """
    merchant_id: str
    recent_txns_60min: list[int]                 # 6 ten-minute buckets, oldest first
    inventory_flags: list[str] = []              # e.g. ["fresh_batch:cappuccino", "low_stock:croissants"]
    staff_capacity: str = "normal"               # "low", "normal", "high"
    daily_budget_burned_pct: float = 0.0         # 0.0-1.0, fraction of today's offer budget already spent
    active_offer_count: int = 0


class UserLocation(BaseModel):
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None


class CustomerIntent(BaseModel):
    """Opaque, on-device-derived hints. Raw customer profile and live signals
    never leave the device; an SLM summarizes them into this object before it
    reaches the backend. All fields are optional — the engine works without them.
    """
    intent_tags: list[str] = []                  # e.g. ["warm_drink", "sit_down", "browsing"]
    preferred_categories: list[str] = []         # e.g. ["cafe", "bakery"]
    price_sensitivity: Optional[str] = None      # "low", "mid", "high"
    movement_state: Optional[str] = None         # "stationary", "walking", "transit"
    session_dwell_seconds: Optional[int] = None
    declined_categories_today: list[str] = []


class ContextState(BaseModel):
    timestamp: datetime
    location: UserLocation
    weather: WeatherData
    time_of_day: str
    day_of_week: str
    is_weekend: bool
    nearby_events: list[EventData]
    merchant_densities: list[TransactionDensity]
    merchant_live_signals: list[MerchantLiveSignal] = []
    context_tags: list[str]
    urgency_score: float


# --- Merchant ---

class MerchantCategory(str, Enum):
    CAFE = "cafe"
    RESTAURANT = "restaurant"
    BAKERY = "bakery"
    BAR = "bar"
    BOOKSTORE = "bookstore"
    RETAIL = "retail"
    GROCERY = "grocery"
    FITNESS = "fitness"


class MerchantRule(BaseModel):
    id: Optional[str] = None
    merchant_id: str
    max_discount_percent: int = 20
    min_discount_percent: int = 5
    active_hours_start: str = "00:00"
    active_hours_end: str = "23:59"
    trigger_conditions: list[str] = []
    goal: str = ""
    max_offers_per_day: int = 10
    offer_type: str = "percentage_discount"
    budget_daily_usd: Optional[float] = None


class Merchant(BaseModel):
    id: str
    name: str
    category: MerchantCategory
    description: str
    latitude: float
    longitude: float
    address: str
    image_url: Optional[str] = None
    # Onboarding profile — captured during merchant signup, slow-changing
    brand_voice: Optional[str] = None             # "friendly", "playful", "sophisticated", "neighborly"
    signature_items: list[str] = []               # e.g. ["cappuccino", "single-origin pour-over"]
    target_demographics: list[str] = []           # e.g. ["young_professional", "tourist"]
    primary_goal: Optional[str] = None            # "fill_quiet_hours", "event_capture", "loyalty_reward"
    daily_budget_usd: Optional[float] = None      # overall daily spend cap
    rules: list[MerchantRule] = []


# --- Offer ---

class OfferStatus(str, Enum):
    ACTIVE = "active"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    REDEEMED = "redeemed"


class OfferStyle(BaseModel):
    background_gradient: list[str]
    tone: str
    headline_style: str


class Offer(BaseModel):
    id: str
    merchant_id: str
    merchant_name: str
    merchant_category: MerchantCategory
    headline: str
    subtext: str
    description: str
    discount_value: str
    discount_type: str
    context_tags: list[str]
    why_now: str
    created_at: datetime
    expires_at: datetime
    style: OfferStyle
    status: OfferStatus
    distance_meters: Optional[float] = None
    redemption_token: Optional[str] = None


# --- Redemption ---

class RedemptionRequest(BaseModel):
    offer_id: str
    token: str


class RedemptionResult(BaseModel):
    success: bool
    offer: Optional[Offer] = None
    message: str
    cashback_amount: Optional[float] = None


# --- Analytics ---

class OfferAnalytics(BaseModel):
    merchant_id: str
    total_generated: int
    total_accepted: int
    total_declined: int
    total_expired: int
    total_redeemed: int
    acceptance_rate: float
    redemption_rate: float
    top_context_triggers: list[str]
    revenue_impact_estimate: float


# --- Request / Response ---

class ContextRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None


class GenerateOffersRequest(BaseModel):
    session_id: str
    context: ContextState
    max_offers: int = 3
    customer_intent: Optional[CustomerIntent] = None  # opaque on-device summary; raw profile stays local
    user_preferences: Optional[dict] = None  # legacy free-form hints, kept for compatibility


class GenerateOffersResponse(BaseModel):
    offers: list[Offer]
    generation_time_ms: int
    context_summary: str


class OfferActionRequest(BaseModel):
    action: str


class MerchantListResponse(BaseModel):
    merchants: list[Merchant]


class OfferListResponse(BaseModel):
    offers: list[Offer]


class TokenValidationResponse(BaseModel):
    valid: bool
    offer: Optional[Offer] = None
    merchant_name: Optional[str] = None
