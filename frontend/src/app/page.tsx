"use client";

import { useState, useEffect } from "react";
import ContextBar from "@/components/ContextBar";
import OfferCard from "@/components/OfferCard";
import BottomNav from "@/components/BottomNav";
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
    description:
      "Warm up at Blue Bottle Coffee. Quiet right now — no queue, your usual spot by the window is free.",
    discount_value: "15%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "cold", "quiet_cafes"],
    why_now: "Raining and unusually quiet for a Saturday afternoon.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 25 * 60000).toISOString(),
    style: {
      background_gradient: [],
      emoji: "",
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
    description:
      "Iconic New York slices since 1975. Wet streets mean shorter wait. Fresh out of the oven.",
    discount_value: "10%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "lunch_hour"],
    why_now: "Rain is keeping foot traffic low. Pizza is fresh.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 18 * 60000).toISOString(),
    style: {
      background_gradient: [],
      emoji: "",
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
    description:
      "Weekend rain has cleared the usual crowds. The stacks are yours.",
    discount_value: "20%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "weekend", "quiet_period"],
    why_now: "Weekend rain cleared the crowds. Best browsing conditions in weeks.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 45 * 60000).toISOString(),
    style: {
      background_gradient: [],
      emoji: "",
      tone: "sophisticated",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 520,
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "10px 20px",
        background: "var(--cw-warm-bg)",
        borderBottom: "1px solid var(--border-1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-small)",
          color: "var(--fg-2)",
        }}
      >
        <i className="ph ph-map-pin" style={{ fontSize: "16px", color: "var(--cw-warm)" }} />
        Using default location. Enable for nearby offers.
      </div>
      <button
        onClick={onEnable}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-small)",
          fontWeight: 600,
          color: "var(--fg-link)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          whiteSpace: "nowrap",
        }}
      >
        Enable
      </button>
    </div>
  );
}

export default function Home() {
  const [consentStatus, handleConsent] = useConsentStatus();

  const handleEnableFromBanner = () => {
    setConsent(true);
    handleConsent(true);
  };

  if (consentStatus === "loading") {
    return <div style={{ minHeight: "100vh", background: "var(--bg-page)" }} />;
  }

  if (consentStatus === "none") {
    return <ConsentModal onConsent={handleConsent} />;
  }

  const taste = getTaste();
  const profile = getProfile();
  const visibleOffers = (() => {
    if (!taste || taste.categories.length === 0) return mockOffers;
    const cats = new Set(taste.categories.map((c) => TASTE_TO_MERCHANT[c]).filter(Boolean));
    const filtered = mockOffers.filter((o) => cats.has(o.merchant_category));
    return filtered.length > 0 ? filtered : mockOffers;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: "96px" }}>
      {consentStatus === "declined" && (
        <LocationBanner onEnable={handleEnableFromBanner} />
      )}

      <ContextBar />

      {/* Map placeholder */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "35vh",
          minHeight: "200px",
          background: "var(--bg-sunken)",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-small)",
              color: "var(--fg-4)",
              letterSpacing: "var(--ls-caps)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {consentStatus === "declined" ? "Map · Times Square (default)" : "Map · Mapbox goes here"}
          </div>
        </div>
      </div>

      {/* Offer feed */}
      <div style={{ flex: 1, padding: "20px 20px 0" }}>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-micro)",
            fontWeight: 600,
            letterSpacing: "var(--ls-caps)",
            textTransform: "uppercase",
            color: "var(--fg-3)",
            marginBottom: "16px",
          }}
        >
          {consentStatus === "declined" ? "Times Square" : profile ? `For you, ${profile.first_name}` : "Near you"} · {visibleOffers.length} {taste ? "matching" : ""} offers
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visibleOffers.map((offer) => (
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
