"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ContextBar from "@/components/ContextBar";
import OfferCard from "@/components/OfferCard";
import BottomNav from "@/components/BottomNav";
import MapView from "@/components/MapView";
import ConsentModal, {
  getConsent,
  setConsent,
  getTaste,
  getProfile,
} from "@/components/ConsentModal";
import { getMerchants } from "@/lib/api";
import {
  DEFAULT_LOCATION,
  getDemoModeFromUrl,
  type DemoMode,
} from "@/lib/demo";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useOffers } from "@/hooks/useOffers";
import { TASTE_TO_MERCHANT } from "@/lib/intent";
import type { ContextState, Merchant } from "@/lib/types";

type ConsentStatus = "loading" | "none" | "granted" | "declined";

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

function DemoBadge({ mode }: { mode: DemoMode }) {
  const labels: Record<DemoMode, string> = {
    rainy_afternoon: "Demo \u00b7 Rainy afternoon",
    hot_weekend: "Demo \u00b7 Hot weekend",
    event_night: "Demo \u00b7 Event night",
  };
  return (
    <div className="border-b border-border-1 bg-cw-dusk-bg px-5 py-2 text-center text-micro font-semibold uppercase tracking-[0.08em] text-cw-dusk">
      {labels[mode]}
    </div>
  );
}

function buildBadges(context: ContextState | null) {
  if (!context) return undefined;
  const badges: {
    icon: string;
    label: string;
    variant: "cool" | "warm" | "fresh" | "dusk" | "neutral";
  }[] = [];

  const w = context.weather;
  const tempStr = `${Math.round(w.temp_celsius)}\u00b0C`;
  const weatherIcon =
    w.condition === "rain"
      ? "ph-cloud-rain"
      : w.condition === "snow"
        ? "ph-snowflake"
        : w.condition === "storm"
          ? "ph-cloud-lightning"
          : w.condition === "cloudy"
            ? "ph-cloud"
            : "ph-sun";
  const weatherVariant =
    w.condition === "rain" || w.condition === "snow" || w.condition === "storm"
      ? "cool"
      : w.condition === "clear"
        ? "warm"
        : "neutral";
  badges.push({
    icon: weatherIcon,
    label: `${w.description} \u00b7 ${tempStr}`,
    variant: weatherVariant,
  });

  const dayCap =
    context.day_of_week.charAt(0).toUpperCase() + context.day_of_week.slice(1);
  const time = new Date(context.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  badges.push({
    icon: "ph-clock",
    label: `${dayCap} \u00b7 ${time}`,
    variant: "neutral",
  });

  if (context.nearby_events.length > 0) {
    badges.push({
      icon: "ph-ticket",
      label: context.nearby_events[0].name,
      variant: "dusk",
    });
  }

  const quietCount = context.merchant_densities.filter(
    (d) => d.trend === "quiet",
  ).length;
  if (quietCount > 0) {
    badges.push({
      icon: "ph-coffee",
      label: `${quietCount} quiet ${quietCount === 1 ? "spot" : "spots"}`,
      variant: "fresh",
    });
  }

  return badges;
}

export default function Home() {
  const router = useRouter();
  const [consentStatus, handleConsent] = useConsentStatus();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(
    null,
  );
  const [demoMode, setDemoMode] = useState<DemoMode | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    setDemoMode(getDemoModeFromUrl());
  }, []);

  const locationEnabled = consentStatus === "granted";
  const geo = useGeolocation(locationEnabled);

  const taste = useMemo(() => getTaste(), [consentStatus]);
  const profile = useMemo(() => getProfile(), [consentStatus]);

  const offersReady =
    consentStatus !== "loading" &&
    consentStatus !== "none" &&
    geo.status !== "loading";
  const { offers, context, status, errorMessage, acceptOffer, dismissOffer } =
    useOffers({
      enabled: offersReady,
      latitude: geo.latitude,
      longitude: geo.longitude,
      accuracy: geo.accuracy,
      demoMode,
    });

  useEffect(() => {
    let alive = true;
    getMerchants()
      .then((res) => {
        if (alive) setMerchants(res.merchants);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const visibleOffers = useMemo(() => {
    if (!taste || taste.categories.length === 0) return offers;
    const cats = new Set(
      taste.categories.map((c) => TASTE_TO_MERCHANT[c]).filter(Boolean),
    );
    const filtered = offers.filter((o) => cats.has(o.merchant_category));
    return filtered.length > 0 ? filtered : offers;
  }, [offers, taste]);

  const offerMerchantIds = useMemo(
    () => new Set(visibleOffers.map((o) => o.merchant_id)),
    [visibleOffers],
  );
  const mapMerchants = useMemo(
    () => merchants.filter((m) => offerMerchantIds.has(m.id)),
    [merchants, offerMerchantIds],
  );

  const handleEnableFromBanner = () => {
    setConsent(true);
    handleConsent(true);
  };

  const handleAccept = async (offerId: string) => {
    const updated = await acceptOffer(offerId);
    if (updated) router.push(`/redeem/${offerId}`);
  };

  const handleDismiss = async (offerId: string) => {
    await dismissOffer(offerId);
  };

  const handleMerchantClick = (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    const offer = visibleOffers.find((o) => o.merchant_id === merchantId);
    if (!offer) return;
    const el = document.getElementById(`offer-card-${offer.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (consentStatus === "loading") {
    return <div className="min-h-screen bg-page" />;
  }

  if (consentStatus === "none") {
    return <ConsentModal onConsent={handleConsent} />;
  }

  const heading =
    consentStatus === "declined"
      ? DEFAULT_LOCATION.label
      : profile
        ? `For you, ${profile.first_name}`
        : "Near you";

  const subheading =
    status === "loading"
      ? "Reading the city\u2026"
      : status === "fallback"
        ? `${visibleOffers.length} sample offers`
        : `${visibleOffers.length} ${taste ? "matching" : ""} offers`;

  const badges = buildBadges(context);

  return (
    <div className="flex min-h-screen flex-col bg-page pb-24">
      {demoMode && <DemoBadge mode={demoMode} />}

      {consentStatus === "declined" && (
        <LocationBanner onEnable={handleEnableFromBanner} />
      )}

      <ContextBar badges={badges} />

      <div className="border-b border-border-1">
        <MapView
          userLocation={{ latitude: geo.latitude, longitude: geo.longitude }}
          merchants={mapMerchants}
          height="35vh"
          selectedMerchantId={selectedMerchantId}
          onMerchantClick={handleMerchantClick}
          fitBounds={mapMerchants.length > 0}
        />
      </div>

      <div className="flex-1 px-5 pt-5">
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <div className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
            {heading} {"\u00b7"} {subheading}
          </div>
          {status === "fallback" && errorMessage && (
            <div className="text-micro text-fg-4" title={errorMessage}>
              offline mode
            </div>
          )}
        </div>

        {status === "loading" && visibleOffers.length === 0 ? (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-4 bg-card-soft" />
            <div className="h-32 animate-pulse rounded-4 bg-card-soft" />
            <div className="h-32 animate-pulse rounded-4 bg-card-soft" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleOffers.map((offer) => (
              <div
                key={offer.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(offer.id, el);
                  else cardRefs.current.delete(offer.id);
                }}
              >
                <OfferCard
                  offer={offer}
                  highlighted={selectedMerchantId === offer.merchant_id}
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
