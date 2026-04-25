"use client";

import ContextBar from "@/components/ContextBar";
import OfferCard from "@/components/OfferCard";
import BottomNav from "@/components/BottomNav";
import type { Offer } from "@/lib/types";

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

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: "96px" }}>
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
            Map · Mapbox goes here
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
          Near you · {mockOffers.length} offers
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {mockOffers.map((offer) => (
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
