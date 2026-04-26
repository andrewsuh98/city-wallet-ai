"use client";

import { useEffect, useMemo, useState } from "react";

import BottomNav from "@/components/BottomNav";
import MapView from "@/components/MapView";
import { getMerchants } from "@/lib/api";
import { DEFAULT_LOCATION } from "@/lib/demo";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getConsent } from "@/components/ConsentModal";
import type { Merchant } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  cafe: "Cafe",
  restaurant: "Restaurant",
  bakery: "Bakery",
  bar: "Bar",
  bookstore: "Bookstore",
  retail: "Retail",
  grocery: "Grocery",
  fitness: "Fitness",
};

function MerchantSheet({ merchant, onClose }: { merchant: Merchant; onClose: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md rounded-4 border border-border-1 bg-card p-4 shadow-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-cw-paper-200 font-display text-base font-semibold text-fg-2">
            {merchant.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-display text-h3 text-fg-1">{merchant.name}</h3>
              <button
                onClick={onClose}
                className="-mr-1 -mt-1 rounded-pill p-1 text-fg-3 hover:bg-card-soft hover:text-fg-1"
                aria-label="Close"
              >
                <i className="ph ph-x text-base" />
              </button>
            </div>
            <p className="text-micro font-semibold uppercase tracking-[0.06em] text-fg-3">
              {CATEGORY_LABEL[merchant.category] ?? merchant.category}
            </p>
            {merchant.description && (
              <p className="mt-2 text-small text-fg-2 leading-snug">{merchant.description}</p>
            )}
            {merchant.address && (
              <p className="mt-2 flex items-start gap-1 text-micro text-fg-3">
                <i className="ph ph-map-pin mt-[2px] shrink-0" />
                <span className="truncate">{merchant.address}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    setLocationEnabled(Boolean(consent?.location_consent));
  }, []);

  const geo = useGeolocation(locationEnabled);

  useEffect(() => {
    let alive = true;
    getMerchants()
      .then((res) => { if (alive) setMerchants(res.merchants); })
      .catch((e: Error) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  const userLocation = useMemo(
    () => ({ latitude: geo.latitude, longitude: geo.longitude }),
    [geo.latitude, geo.longitude],
  );

  const selected = useMemo(
    () => merchants.find((m) => m.id === selectedId) ?? null,
    [merchants, selectedId],
  );

  return (
    <div className="flex min-h-screen flex-col bg-page pb-24">
      <header className="border-b border-border-1 bg-page px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
              Map
            </div>
            <h1
              className="mt-1 font-display text-h2 leading-snug text-fg-1"
              style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 60, "SOFT" 30' }}
            >
              {merchants.length > 0
                ? `${merchants.length} merchants nearby`
                : "Loading merchants\u2026"}
            </h1>
          </div>
          {geo.isDefault && (
            <span className="rounded-pill bg-cw-warm-bg px-2.5 py-1 text-micro font-semibold uppercase tracking-[0.06em] text-cw-warm">
              {DEFAULT_LOCATION.label}
            </span>
          )}
        </div>
      </header>

      <main className="relative flex-1">
        <MapView
          userLocation={userLocation}
          merchants={merchants}
          height="100%"
          selectedMerchantId={selectedId}
          onMerchantClick={(id) => setSelectedId((curr) => (curr === id ? null : id))}
          fitBounds={merchants.length > 0}
          initialZoom={13}
        />

        {selected && (
          <MerchantSheet merchant={selected} onClose={() => setSelectedId(null)} />
        )}

        {error && (
          <div className="absolute inset-x-4 top-4 rounded-3 border border-status-danger/30 bg-cw-red-50 p-3 text-small text-status-danger">
            {error}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
