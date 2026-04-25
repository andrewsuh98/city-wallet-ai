"use client";

import BottomNav from "@/components/BottomNav";

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

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="flex w-full max-w-sm flex-col items-center rounded-4 border border-border-1 bg-card p-8 text-center shadow-2">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-pill bg-cw-cool-bg">
            <i className="ph ph-map-trifold text-2xl text-cw-cool" />
          </div>
          <h2
            className="mb-2 font-display text-h2 text-fg-1"
            style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 60, "SOFT" 30' }}
          >
            Map view coming soon
          </h2>
          <p className="text-small leading-normal text-fg-2">
            We are wiring up the live map of merchants and active offers around you. For now, head back to the feed to see what is nearby.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
