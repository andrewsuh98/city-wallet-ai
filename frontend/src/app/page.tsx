"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import OfferCard from "@/components/OfferCard";
import BottomNav from "@/components/BottomNav";
import CategoryChips from "@/components/CategoryChips";
import ConsentModal, { getConsent, setConsent, getTaste, getProfile } from "@/components/ConsentModal";
import { DEFAULT_LOCATION, getDemoModeFromUrl, type DemoMode } from "@/lib/demo";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useOffers } from "@/hooks/useOffers";
import type { MerchantCategory, Offer } from "@/lib/types";

interface DisplayOffer extends Offer {
  taste_tag: string;
}

const SWIPE_ACTION_THRESHOLD = 112;
const SWIPE_VELOCITY_THRESHOLD = 650;

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
  cocktails: "bar",
  healthy: "restaurant",
};

const MERCHANT_TO_TASTE: Partial<Record<MerchantCategory, string>> = {
  cafe: "coffee",
  restaurant: "pizza",
  bakery: "bakery",
  bar: "cocktails",
  bookstore: "coffee",
  retail: "desserts",
  grocery: "healthy",
  fitness: "healthy",
};

const CATEGORY_EMOJI: Partial<Record<MerchantCategory, string>> = {
  cafe: "☕",
  restaurant: "🍽️",
  bakery: "🥐",
  bar: "🍸",
  bookstore: "📚",
  retail: "🛍️",
  grocery: "🥪",
  fitness: "💪",
};

function formatDistance(meters: number | null): string {
  if (meters == null) return "Nearby";
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

function formatDiscount(value: string): string {
  if (!value) return "Deal";
  if (value.endsWith("%")) return `${value} off`;
  return value;
}

function formatTimeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m left`;
}

function tasteTagForOffer(offer: Offer): string {
  const tags = new Set(offer.context_tags);
  const directTaste = Object.keys(TASTE_TO_MERCHANT).find((taste) => tags.has(taste));
  return directTaste ?? MERCHANT_TO_TASTE[offer.merchant_category] ?? "coffee";
}

function getOfferEmoji(offer: Offer): string {
  return offer.style.emoji ?? CATEGORY_EMOJI[offer.merchant_category] ?? "🏷️";
}

type ConsentStatus = "loading" | "none" | "granted" | "declined";

function readConsentStatus(): ConsentStatus {
  const consent = getConsent();
  if (!consent) return "none";
  return consent.location_consent ? "granted" : "declined";
}

function useConsentStatus(): [ConsentStatus, (locationEnabled: boolean) => void] {
  const storedStatus: ConsentStatus = useSyncExternalStore(
    () => () => {},
    readConsentStatus,
    (): ConsentStatus => "loading",
  );
  const [statusOverride, setStatusOverride] = useState<ConsentStatus | null>(null);

  const handleConsent = (locationEnabled: boolean) => {
    setStatusOverride(locationEnabled ? "granted" : "declined");
  };

  return [statusOverride ?? storedStatus, handleConsent];
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
    rainy_afternoon: "Demo · Rainy afternoon",
    hot_weekend: "Demo · Hot weekend",
    event_night: "Demo · Event night",
  };

  return (
    <div className="border-b border-border-1 bg-cw-dusk-bg px-5 py-2 text-center text-micro font-semibold uppercase tracking-[0.08em] text-cw-dusk">
      {labels[mode]}
    </div>
  );
}

function SwipeableOfferCard({
  offer,
  onAccept,
  onDismiss,
  onOpenDetails,
}: {
  offer: DisplayOffer;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onOpenDetails: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const [isExiting, setIsExiting] = useState(false);
  const suppressOpenRef = useRef(false);
  const suppressOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTakenRef = useRef(false);
  const rotate = useTransform(x, [-180, 0, 180], [-2.5, 0, 2.5]);
  const dismissOpacity = useTransform(x, [-110, -24], [1, 0]);
  const claimOpacity = useTransform(x, [24, 110], [0, 1]);
  const dismissScale = useTransform(x, [-130, -40], [1, 0.92]);
  const claimScale = useTransform(x, [40, 130], [0.92, 1]);
  const dismissContentX = useTransform(x, [-150, -36], [0, 22]);
  const claimContentX = useTransform(x, [36, 150], [-22, 0]);

  useEffect(() => {
    return () => {
      if (suppressOpenTimerRef.current) {
        clearTimeout(suppressOpenTimerRef.current);
      }
    };
  }, []);

  const clearSuppressOpenTimer = () => {
    if (suppressOpenTimerRef.current) {
      clearTimeout(suppressOpenTimerRef.current);
      suppressOpenTimerRef.current = null;
    }
  };

  const suppressOpenBriefly = () => {
    suppressOpenRef.current = true;
    clearSuppressOpenTimer();
    suppressOpenTimerRef.current = setTimeout(() => {
      suppressOpenRef.current = false;
      suppressOpenTimerRef.current = null;
    }, 250);
  };

  const resetPosition = () => {
    animate(x, 0, { type: "spring", stiffness: 420, damping: 34 });
  };

  const dismiss = () => {
    if (actionTakenRef.current) return;
    actionTakenRef.current = true;
    setIsExiting(true);
    const offscreen = typeof window === "undefined" ? 480 : window.innerWidth + 120;
    void animate(x, -offscreen, { type: "spring", stiffness: 360, damping: 36 });
    onDismiss(offer.id);
  };

  const accept = () => {
    if (actionTakenRef.current) return;
    actionTakenRef.current = true;
    setIsExiting(true);
    const offscreen = typeof window === "undefined" ? 480 : window.innerWidth + 120;
    void animate(x, offscreen, { type: "spring", stiffness: 360, damping: 36 });
    onAccept(offer.id);
  };

  const handleDragStart = () => {
    suppressOpenRef.current = true;
    clearSuppressOpenTimer();
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    suppressOpenBriefly();

    if (info.offset.x <= -SWIPE_ACTION_THRESHOLD || info.velocity.x <= -SWIPE_VELOCITY_THRESHOLD) {
      dismiss();
      return;
    }

    if (info.offset.x >= SWIPE_ACTION_THRESHOLD || info.velocity.x >= SWIPE_VELOCITY_THRESHOLD) {
      accept();
      return;
    }

    resetPosition();
  };

  const handleOpenDetails = (id: string) => {
    if (suppressOpenRef.current) return;
    onOpenDetails(id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className="relative mb-3 overflow-hidden rounded-4"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-4 bg-cw-paper-100 shadow-inner"
        style={{ visibility: isExiting ? "hidden" : "visible" }}
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            opacity: claimOpacity,
            background:
              "radial-gradient(circle at 18% 50%, rgba(255,255,255,0.28), transparent 34%), linear-gradient(135deg, #f87171 0%, #dc2626 46%, #991b1b 100%)",
          }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            opacity: dismissOpacity,
            background:
              "radial-gradient(circle at 82% 50%, rgba(255,255,255,0.14), transparent 32%), linear-gradient(135deg, #374151 0%, #111827 52%, #030712 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-45 mix-blend-soft-light"
          style={{
            background:
              "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.24) 46%, transparent 62%)",
          }}
        />
        <div className="relative grid h-full grid-cols-2">
          <motion.div
            className="flex items-center justify-start gap-2 px-5 text-small font-bold text-white"
            style={{ opacity: claimOpacity }}
          >
            <motion.span style={{ scale: claimScale, x: claimContentX }} className="inline-flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/18 shadow-1 backdrop-blur-sm">
                <i className="ph ph-ticket text-lg" />
              </span>
              <span>Claim</span>
            </motion.span>
          </motion.div>
          <motion.div
            className="flex items-center justify-end gap-2 px-5 text-small font-bold text-white"
            style={{ opacity: dismissOpacity }}
          >
            <motion.span style={{ scale: dismissScale, x: dismissContentX }} className="inline-flex items-center gap-2">
              <span>Not now</span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 shadow-1 backdrop-blur-sm">
                <i className="ph ph-x text-lg" />
              </span>
            </motion.span>
          </motion.div>
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, touchAction: "pan-y" }}
        whileTap={{ scale: 0.995 }}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        <OfferCard
          offer={offer}
          onAccept={accept}
          onDismiss={dismiss}
          onOpenDetails={handleOpenDetails}
        />
      </motion.div>
    </motion.div>
  );
}

function OfferDetailsSheet({
  offer,
  onClose,
  onAccept,
  onDismiss,
}: {
  offer: DisplayOffer;
  onClose: () => void;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const discount = formatDiscount(offer.discount_value);
  const category = offer.merchant_category.replace("_", " ");

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-details-title"
        className="max-h-[86vh] w-full max-w-[500px] overflow-hidden rounded-4 border border-border-1 bg-card shadow-3"
        initial={{ y: 12, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 12, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border-1 bg-card px-5 pb-4 pt-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-1 bg-cw-paper-50 px-3 py-1 text-small font-semibold capitalize text-fg-2">
              <i className="ph ph-storefront text-sm" />
              {category}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cw-paper-100 text-fg-3 transition-colors hover:bg-cw-paper-200 hover:text-fg-1"
              aria-label="Close offer details"
            >
              <i className="ph ph-x text-lg" />
            </button>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-3 bg-cw-paper-100 text-[28px]">
              {getOfferEmoji(offer)}
            </div>
            <div className="min-w-0">
              <div id="offer-details-title" className="text-h2 font-semibold text-fg-1">
                {offer.merchant_name}
              </div>
              <div className="mt-0.5 text-small font-semibold text-cw-red-600">
                {discount}
              </div>
            </div>
          </div>

          <div className="font-display text-[21px] font-semibold leading-tight text-fg-2">
            {offer.headline}
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-3 bg-cw-paper-50 p-3">
              <div className="mb-1 text-micro font-semibold uppercase tracking-[0.08em] text-fg-4">Distance</div>
              <div className="text-small font-bold text-fg-1">{formatDistance(offer.distance_meters)}</div>
            </div>
            <div className="rounded-3 bg-cw-paper-50 p-3">
              <div className="mb-1 text-micro font-semibold uppercase tracking-[0.08em] text-fg-4">Expires</div>
              <div className="text-small font-bold text-fg-1">{formatTimeLeft(offer.expires_at)}</div>
            </div>
          </div>

          <section>
            <div className="mb-1 text-micro font-semibold uppercase tracking-[0.08em] text-fg-4">Offer</div>
            <p className="text-body leading-relaxed text-fg-2">{offer.description}</p>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-1 bg-cw-paper-50 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onDismiss(offer.id);
              onClose();
            }}
            className="text-small font-semibold text-fg-4 transition-colors hover:text-fg-2"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => {
              onAccept(offer.id);
              onClose();
            }}
            className="inline-flex items-center gap-2 rounded-3 bg-action-primary px-5 py-2.5 text-body font-bold text-fg-on-red shadow-1 transition-all duration-200 hover:bg-action-primary-hover hover:shadow-2 active:bg-action-primary-press"
          >
            <i className="ph ph-ticket text-lg" />
            Claim this deal
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const [consentStatus, handleConsent] = useConsentStatus();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [removedOfferIds, setRemovedOfferIds] = useState<Set<string>>(new Set());
  const [demoMode] = useState<DemoMode | null>(() => getDemoModeFromUrl());

  useEffect(() => {
    if (!selectedOfferId) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedOfferId]);

  const locationEnabled = consentStatus === "granted";
  const geo = useGeolocation(locationEnabled);
  const taste = getTaste();
  const profile = getProfile();
  const intentTags = useMemo(() => taste?.categories ?? [], [taste]);
  const pastCategories = useMemo(
    () =>
      Array.from(
        new Set(
          (taste?.categories ?? [])
            .map((c) => TASTE_TO_MERCHANT[c])
            .filter((c): c is MerchantCategory => Boolean(c)),
        ),
      ),
    [taste],
  );

  const offersReady = consentStatus !== "loading" && consentStatus !== "none" && geo.status !== "loading";
  const { offers, status, acceptOffer, dismissOffer } = useOffers({
    enabled: offersReady,
    latitude: geo.latitude,
    longitude: geo.longitude,
    accuracy: geo.accuracy,
    demoMode,
    intentTags,
    pastCategories,
  });

  const allActive = useMemo<DisplayOffer[]>(
    () =>
      offers
        .filter((offer) => offer.status === "active" && !removedOfferIds.has(offer.id))
        .map((offer) => ({ ...offer, taste_tag: tasteTagForOffer(offer) })),
    [offers, removedOfferIds],
  );

  const selectedOffer = allActive.find((o) => o.id === selectedOfferId) ?? null;

  const visibleOffers = categoryFilter === "all"
    ? allActive
    : allActive.filter((o) => o.taste_tag === categoryFilter);

  const displayOffers = visibleOffers.length > 0 ? visibleOffers : allActive;

  const availableTastes = new Set(
    allActive.map((o) => o.taste_tag).filter(Boolean)
  );

  const handleEnableFromBanner = () => {
    setConsent(true);
    handleConsent(true);
  };

  const handleAccept = async (id: string) => {
    setSelectedOfferId(null);
    setRemovedOfferIds((prev) => new Set(prev).add(id));
    const updated = await acceptOffer(id);
    if (updated) router.push(`/redeem/${id}`);
  };

  const handleDismiss = async (id: string) => {
    setSelectedOfferId(null);
    setRemovedOfferIds((prev) => new Set(prev).add(id));
    await dismissOffer(id);
  };

  if (consentStatus === "loading") {
    return <div className="min-h-screen bg-page" />;
  }

  if (consentStatus === "none") {
    return <ConsentModal onConsent={handleConsent} />;
  }

  const heading = consentStatus === "declined"
    ? DEFAULT_LOCATION.label
    : profile
      ? `For you, ${profile.first_name}`
      : "Near you";

  const offerCountLabel = status === "loading" && displayOffers.length === 0
    ? "loading offers"
    : `${displayOffers.length} offers`;

  return (
    <div className="flex min-h-screen flex-col bg-page pb-24">
      {demoMode && <DemoBadge mode={demoMode} />}

      {consentStatus === "declined" && (
        <LocationBanner onEnable={handleEnableFromBanner} />
      )}

      <div className="border-b border-border-1 bg-sunken px-5 py-3">
        <div className="flex items-center justify-between gap-3 text-small text-fg-3">
          <div className="flex items-center gap-2">
            <i className="ph ph-map-pin text-base text-cw-warm" />
            {geo.isDefault ? `${DEFAULT_LOCATION.label} (default)` : "Near Columbia University"}
          </div>
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
          {heading} {"·"} {offerCountLabel}
        </div>

        {status === "loading" && displayOffers.length === 0 ? (
          <div className="space-y-3">
            <div className="h-36 animate-pulse rounded-4 bg-card-soft" />
            <div className="h-36 animate-pulse rounded-4 bg-card-soft" />
            <div className="h-36 animate-pulse rounded-4 bg-card-soft" />
          </div>
        ) : (
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {displayOffers.map((offer) => (
                <SwipeableOfferCard
                  key={offer.id}
                  offer={offer}
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                  onOpenDetails={setSelectedOfferId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <BottomNav />

      <AnimatePresence>
        {selectedOffer && (
          <OfferDetailsSheet
            key={selectedOffer.id}
            offer={selectedOffer}
            onClose={() => setSelectedOfferId(null)}
            onAccept={handleAccept}
            onDismiss={handleDismiss}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
