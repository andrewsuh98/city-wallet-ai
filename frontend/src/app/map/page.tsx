"use client";

import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";

const HomeMap = dynamic(() => import("@/components/HomeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-sunken">
      <div className="text-small font-semibold uppercase tracking-[0.08em] text-fg-4">
        Loading map...
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page pb-24">
      <header className="border-b border-border-1 bg-page px-5 py-4">
        <div className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
          Map
        </div>
        <h1
          className="mt-1 font-display text-h1 leading-snug text-fg-1"
          style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 60, "SOFT" 30' }}
        >
          Nearby offers, on the map
        </h1>
      </header>

      <div className="flex-1">
        <HomeMap />
      </div>

      <BottomNav />
    </div>
  );
}
