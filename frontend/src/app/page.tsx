"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ContextBar from "@/components/ContextBar";
import OfferCard from "@/components/OfferCard";
import BottomNav from "@/components/BottomNav";
import ConsentModal, {
  getConsent,
  setConsent,
  getTaste,
  getProfile,
} from "@/components/ConsentModal";
import { getContext, generateOffers, updateOffer } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import type { Offer, MerchantCategory } from "@/lib/types";

const NYC_FALLBACK = { latitude: 40.758, longitude: -73.9855 };

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

type ConsentStatus = "loading" | "none" | "granted" | "declined";

async function resolveLocation(consentGranted: boolean): Promise<{
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
}> {
  if (!consentGranted) return NYC_FALLBACK;
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(NYC_FALLBACK);
      return;
    }
    const timeout = setTimeout(() => resolve(NYC_FALLBACK), 5000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_meters: pos.coords.accuracy,
        });
      },
      () => {
        clearTimeout(timeout);
        resolve(NYC_FALLBACK);
      },
    );
  });
}

function useConsentStatus(): [
  ConsentStatus,
  (locationEnabled: boolean) => void,
] {
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

function HomeContent() {
  const searchParams = useSearchParams();
  const demo = searchParams.get("demo") ?? undefined;

  const [consentStatus, handleConsent] = useConsentStatus();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (consentStatus === "loading" || consentStatus === "none") return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const location = await resolveLocation(consentStatus === "granted");
        const context = await getContext(location, demo);
        const sessionId = getSessionId();
        const { offers: fresh } = await generateOffers({
          session_id: sessionId,
          context,
          max_offers: 3,
        });
        if (!cancelled) setOffers(fresh);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error && err.message.includes("503")
              ? "Offers are unavailable right now. Try again in a moment."
              : "Something went wrong loading offers.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [consentStatus, demo]);

  const handleEnableFromBanner = () => {
    setConsent(true);
    handleConsent(true);
  };

  async function handleAccept(id: string) {
    try {
      const { offer } = await updateOffer(id, { action: "accept" });
      setOffers((prev) => prev.map((o) => (o.id === id ? offer : o)));
    } catch (err) {
      console.error("Failed to accept offer", err);
    }
  }

  async function handleDismiss(id: string) {
    try {
      await updateOffer(id, { action: "dismiss" });
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Failed to dismiss offer", err);
    }
  }

  if (consentStatus === "loading") {
    return <div className="min-h-screen bg-page" />;
  }

  if (consentStatus === "none") {
    return <ConsentModal onConsent={handleConsent} />;
  }

  const taste = getTaste();
  const profile = getProfile();

  const visibleOffers = (() => {
    if (!taste || taste.categories.length === 0) return offers;
    const cats = new Set(
      taste.categories.map((c) => TASTE_TO_MERCHANT[c]).filter(Boolean),
    );
    const filtered = offers.filter((o) => cats.has(o.merchant_category));
    return filtered.length > 0 ? filtered : offers;
  })();

  const heading =
    consentStatus === "declined"
      ? "Times Square"
      : profile
        ? `For you, ${profile.first_name}`
        : "Near you";

  return (
    <div className="flex min-h-screen flex-col bg-page pb-24">
      {consentStatus === "declined" && (
        <LocationBanner onEnable={handleEnableFromBanner} />
      )}

      <ContextBar />

      <div className="flex h-[35vh] min-h-[200px] items-center justify-center border-b border-border-1 bg-sunken">
        <div className="text-center text-small font-semibold uppercase tracking-[0.08em] text-fg-4">
          {consentStatus === "declined"
            ? "Map · Times Square (default)"
            : "Map · Mapbox goes here"}
        </div>
      </div>

      <div className="flex-1 px-5 pt-5">
        <div className="mb-4 text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
          {heading} {"·"}{" "}
          {loading
            ? "loading..."
            : `${visibleOffers.length} ${taste ? "matching" : ""} offers`}
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-4 border border-border-1 bg-card"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-4 border border-border-1 bg-card p-4 text-small text-fg-3">
            {error}
          </div>
        )}

        {!loading && !error && visibleOffers.length === 0 && (
          <div className="rounded-4 border border-border-1 bg-card p-6 text-center text-small text-fg-3">
            No offers nearby right now. Check back soon.
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-3">
            {visibleOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
