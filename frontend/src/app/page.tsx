"use client";

import { useState, useEffect } from "react";
import OfferCard from "@/components/OfferCard";
import BottomNav from "@/components/BottomNav";
import CategoryChips from "@/components/CategoryChips";
import ConsentModal, { getConsent, setConsent, getTaste, getProfile } from "@/components/ConsentModal";
import type { Offer, MerchantCategory } from "@/lib/types";

const TASTE_TO_MERCHANT: Record<string, MerchantCategory> = {
  coffee: "cafe",
  bubble_tea: "cafe",
  pizza: "restaurant",
  sushi: "restaurant",
  burgers: "restaurant",
  brunch: "restaurant",
  tacos: "restaurant",
  ramen: "restaurant",
  bakery: "bakery",
  desserts: "bakery",
  cocktails: "restaurant",
  healthy: "restaurant",
};

const mockOffers: Offer[] = [
  {
    id: "off_mock_1",
    merchant_id: "m_001",
    merchant_name: "Blue Bottle Coffee",
    merchant_category: "cafe",
    headline: "Cold outside? Your cappuccino is waiting.",
    subtext: "2 min walk · Rockefeller Center",
    description: "Warm up at Blue Bottle Coffee. Quiet right now, no queue, your usual spot by the window is free.",
    discount_value: "15%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "cold", "quiet_cafes"],
    why_now: "Raining and unusually quiet for a Saturday afternoon.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 25 * 60000).toISOString(),
    style: {
      background_gradient: ["#4A2C2A", "#D4A574"],
      emoji: "☕",
      tone: "warm",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 180,
    redemption_token: null,
  },
  {
    id: "off_mock_2",
    merchant_id: "m_002",
    merchant_name: "Joe's Pizza",
    merchant_category: "restaurant",
    headline: "Rain keeping people away. The oven is not.",
    subtext: "4 min walk · Greenwich Village",
    description: "Iconic New York slices since 1975. Wet streets mean shorter wait. Fresh out of the oven.",
    discount_value: "10%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "lunch_hour"],
    why_now: "Rain is keeping foot traffic low. Pizza is fresh.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 8 * 60000).toISOString(),
    style: {
      background_gradient: ["#1E3A8A", "#3B82F6"],
      emoji: "🍕",
      tone: "playful",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 350,
    redemption_token: null,
  },
  {
    id: "off_mock_3",
    merchant_id: "m_003",
    merchant_name: "The Strand Bookstore",
    merchant_category: "bookstore",
    headline: "18 miles of books. Perfect afternoon for it.",
    subtext: "6 min walk · Union Square",
    description: "Weekend rain has cleared the usual crowds. The stacks are yours.",
    discount_value: "20%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "weekend", "quiet_period"],
    why_now: "Weekend rain cleared the crowds. Best browsing conditions in weeks.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 45 * 60000).toISOString(),
    style: {
      background_gradient: ["#1a1a2e", "#16213e"],
      emoji: "📚",
      tone: "sophisticated",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 520,
    redemption_token: null,
  },
  {
    id: "off_mock_4",
    merchant_id: "m_004",
    merchant_name: "Levain Bakery",
    merchant_category: "bakery",
    headline: "Warm cookies. Cold rain. You do the math.",
    subtext: "3 min walk · Upper West Side",
    description: "Their famous chocolate chip walnut cookie, straight from the oven. Rainy days are cookie days.",
    discount_value: "12%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "cold", "quiet_period"],
    why_now: "Rainy afternoon, bakery is quiet, cookies are fresh.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 20 * 60000).toISOString(),
    style: {
      background_gradient: ["#92400E", "#D97706"],
      emoji: "🍪",
      tone: "warm",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 240,
    redemption_token: null,
  },
  {
    id: "off_mock_5",
    merchant_id: "m_005",
    merchant_name: "Shake Shack",
    merchant_category: "restaurant",
    headline: "Burger break? The line is short for once.",
    subtext: "5 min walk · Madison Square Park",
    description: "Rain has cleared the usual lunchtime crowd. ShackBurger and fries, no wait.",
    discount_value: "8%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "lunch_hour", "quiet_period"],
    why_now: "Rainy lunch hour — line is unusually short.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 12 * 60000).toISOString(),
    style: {
      background_gradient: ["#065F46", "#10B981"],
      emoji: "🍔",
      tone: "playful",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 410,
    redemption_token: null,
  },
  {
    id: "off_mock_6",
    merchant_id: "m_006",
    merchant_name: "Cha Cha Matcha",
    merchant_category: "cafe",
    headline: "Rainy day matcha. Green calm in the grey.",
    subtext: "3 min walk · NoLIta",
    description: "Cozy up with a ceremonial-grade matcha latte. The rain outside makes it taste better.",
    discount_value: "15%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "quiet_cafes", "afternoon"],
    why_now: "Quiet afternoon, perfect for a slow matcha moment.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
    style: {
      background_gradient: ["#14532D", "#4ADE80"],
      emoji: "🍵",
      tone: "warm",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 260,
    redemption_token: null,
  },
  {
    id: "off_mock_7",
    merchant_id: "m_007",
    merchant_name: "Equinox",
    merchant_category: "fitness",
    headline: "Skip the rain. Hit the gym instead.",
    subtext: "7 min walk · Hudson Yards",
    description: "Turn a rainy afternoon into gains. Day pass includes pool, sauna, and all classes.",
    discount_value: "25%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "afternoon", "weekend"],
    why_now: "Weekend rain — perfect excuse to try a workout instead.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 55 * 60000).toISOString(),
    style: {
      background_gradient: ["#18181B", "#3F3F46"],
      emoji: "🏋️",
      tone: "sophisticated",
      headline_style: "factual",
    },
    status: "active",
    distance_meters: 580,
    redemption_token: null,
  },
];

type ConsentStatus = "loading" | "none" | "granted" | "declined";

function useConsentStatus(): [ConsentStatus, (locationEnabled: boolean) => void] {
  const [status, setStatus] = useState<ConsentStatus>("loading");

  useEffect(() => {
    const consent = getConsent();
    if (!consent) {
      setStatus("none");
    } else if (consent.location_consent) {
      setStatus("granted");
    } else {
      setStatus("declined");
    }
  }, []);

  const handleConsent = (locationEnabled: boolean) => {
    setStatus(locationEnabled ? "granted" : "declined");
  };

  return [status, handleConsent];
}

function LocationBanner({ onEnable }: { onEnable: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-1 bg-cw-warm-bg px-5 py-2.5">
      <div className="flex items-center gap-2 text-small text-fg-2">
        <i className="ph ph-map-pin text-base text-cw-warm" />
        Using default location. Enable for nearby offers.
      </div>
      <button
        onClick={onEnable}
        className="whitespace-nowrap text-small font-semibold text-fg-link hover:opacity-80"
      >
        Enable
      </button>
    </div>
  );
}

export default function Home() {
  const [consentStatus, handleConsent] = useConsentStatus();
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleEnableFromBanner = () => {
    setConsent(true);
    handleConsent(true);
  };

  if (consentStatus === "loading") {
    return <div className="min-h-screen bg-page" />;
  }

  if (consentStatus === "none") {
    return <ConsentModal onConsent={handleConsent} />;
  }

  const taste = getTaste();
  const profile = getProfile();

  const tasteFiltered = (() => {
    if (!taste || taste.categories.length === 0) return mockOffers;
    const cats = new Set(taste.categories.map((c) => TASTE_TO_MERCHANT[c]).filter(Boolean));
    const filtered = mockOffers.filter((o) => cats.has(o.merchant_category));
    return filtered.length > 0 ? filtered : mockOffers;
  })();

  const visibleOffers = categoryFilter === "all"
    ? tasteFiltered
    : tasteFiltered.filter((o) => o.merchant_category === TASTE_TO_MERCHANT[categoryFilter]);

  const displayOffers = visibleOffers.length > 0 ? visibleOffers : tasteFiltered;

  const offerMerchantCats = new Set(tasteFiltered.map((o) => o.merchant_category));
  const availableTastes = new Set(
    Object.entries(TASTE_TO_MERCHANT)
      .filter(([, mc]) => offerMerchantCats.has(mc))
      .map(([tasteId]) => tasteId)
  );

  const heading = consentStatus === "declined"
    ? "Times Square"
    : profile
      ? `For you, ${profile.first_name}`
      : "Near you";

  return (
    <div className="flex min-h-screen flex-col bg-page pb-24">
      {consentStatus === "declined" && (
        <LocationBanner onEnable={handleEnableFromBanner} />
      )}

      <div className="flex h-[20vh] min-h-[120px] items-center justify-center border-b border-border-1 bg-sunken">
        <div className="text-center text-small font-semibold uppercase tracking-[0.08em] text-fg-4">
          {consentStatus === "declined" ? "Map · Times Square (default)" : "Map · Mapbox goes here"}
        </div>
      </div>

      <CategoryChips
        selected={categoryFilter}
        onSelect={setCategoryFilter}
        userTastes={taste?.categories}
        availableTastes={availableTastes}
      />

      <div className="flex-1 px-5">
        <div className="mb-2 text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
          {heading} {"·"} {displayOffers.length} {taste ? "matching" : ""} offers
        </div>

        <div className="flex flex-col gap-3">
          {displayOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onAccept={(id) => console.log("Accept:", id)}
              onDismiss={(id) => console.log("Dismiss:", id)}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
