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
    subtext: "15% off at Blue Bottle Coffee, 2 min walk",
    description:
      "Warm up with a handcrafted cappuccino at Blue Bottle Coffee. Their Rockefeller Center location is quiet right now.",
    discount_value: "15%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "cold", "quiet_cafes"],
    why_now:
      "It's raining and Blue Bottle is unusually quiet for a Saturday afternoon.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 25 * 60000).toISOString(),
    style: {
      background_gradient: ["#4A2C2A", "#D4A574"],
      emoji: "\u2615",
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
    headline: "Rainy day? Grab a legendary slice.",
    subtext: "10% off at Joe's Pizza, 4 min walk",
    description:
      "Iconic New York slices since 1975. Skip the rain, duck in for a hot slice and stay dry.",
    discount_value: "10%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "lunch_hour"],
    why_now: "Rain is keeping people away, but the pizza is fresh out of the oven.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 18 * 60000).toISOString(),
    style: {
      background_gradient: ["#1a3a5c", "#4a7c9b"],
      emoji: "\uD83C\uDF55",
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
    headline: "18 miles of books. One perfect afternoon.",
    subtext: "20% off one book at The Strand, 6 min walk",
    description:
      "The rain makes it a perfect day to get lost in the stacks. The Strand has room for you to browse without the crowds.",
    discount_value: "20%",
    discount_type: "percentage_discount",
    context_tags: ["rainy", "weekend", "quiet_period"],
    why_now:
      "Weekend rain has cleared the usual crowds. Perfect browsing conditions.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 45 * 60000).toISOString(),
    style: {
      background_gradient: ["#2D1B4E", "#1a1a3e"],
      emoji: "\uD83D\uDCDA",
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
    <div className="flex flex-col min-h-screen pb-16">
      {/* Context bar */}
      <ContextBar />

      {/* Map placeholder */}
      <div className="flex items-center justify-center bg-[#1a1a1a] border-b border-white/10 h-[35vh] min-h-[200px]">
        <div className="text-center">
          <div className="text-4xl mb-2 text-white/20">Map</div>
          <p className="text-sm text-white/30">
            Mapbox integration goes here
          </p>
        </div>
      </div>

      {/* Offer feed */}
      <div className="flex-1 px-4 py-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Nearby Offers</h2>
          <span className="text-xs text-white/40">
            {mockOffers.length} offers
          </span>
        </div>

        {mockOffers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onAccept={(id) => console.log("Accept:", id)}
            onDismiss={(id) => console.log("Dismiss:", id)}
          />
        ))}
      </div>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
