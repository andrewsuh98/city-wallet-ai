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


class UserLocation(BaseModel):
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None


class ContextState(BaseModel):
    timestamp: datetime
    location: UserLocation
    weather: WeatherData
    time_of_day: str
    day_of_week: str
    is_weekend: bool
    nearby_events: list[EventData]
    merchant_densities: list[TransactionDensity]
    context_tags: list[str]
    urgency_score: float


# --- Merchant ---

class MerchantCategory(str, Enum):
    CAFE = "cafe"
    RESTAURANT = "restaurant"
    RETAIL = "retail"
    BAKERY = "bakery"
    BAR = "bar"
    BOOKSTORE = "bookstore"
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
    emoji: str
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


class DailyMetric(BaseModel):
    date: str
    redemptions: int
    revenue_usd: float
    avg_discount_pct: float


class HourlyRedemption(BaseModel):
    hour: int
    count: int


class MerchantDashboardStats(BaseModel):
    merchant_id: str
    period_days: int
    incremental_revenue_usd: float
    total_redemptions: int
    avg_ticket_usd: float
    avg_discount_pct: float
    campaign_active: bool
    is_paused: bool
    strategy: str
    max_discount_percent: int
    min_spend_usd: float
    total_generated: int
    total_accepted: int
    acceptance_rate: float
    redemption_rate: float
    daily_series: list[DailyMetric]
    hourly_redemptions: list[HourlyRedemption]
    dead_hour_ranges: list[tuple[int, int]]
    top_context_triggers: list[str]


class CampaignPatchRequest(BaseModel):
    paused: bool


# --- Request / Response ---

class ContextRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None


class GenerateOffersRequest(BaseModel):
    context: ContextState
    max_offers: int = 3
    user_preferences: Optional[dict] = None


class GenerateOffersResponse(BaseModel):
    offers: list[Offer]
    generation_time_ms: int
    context_summary: str


class OfferActionRequest(BaseModel):
    action: str


class MerchantListResponse(BaseModel):
    merchants: list[Merchant]


class TokenValidationResponse(BaseModel):
    valid: bool
    offer: Optional[Offer] = None
    merchant_name: Optional[str] = None
