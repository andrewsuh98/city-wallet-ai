"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import OfferCard from "@/components/OfferCard";
import BottomNav from "@/components/BottomNav";
import CategoryChips from "@/components/CategoryChips";
import ConsentModal, { getConsent, setConsent, getTaste, getProfile } from "@/components/ConsentModal";
import type { Offer } from "@/lib/types";

interface MockOffer extends Offer {
  taste_tag: string;
}

const SWIPE_ACTION_THRESHOLD = 112;
const SWIPE_VELOCITY_THRESHOLD = 650;

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

const mockOffers: MockOffer[] = [
  {
    id: "off_mock_1",
    merchant_id: "m_001",
    merchant_name: "Blue Bottle Coffee",
    merchant_category: "cafe",
    taste_tag: "coffee",
    headline: "Your cappuccino is waiting.",
    subtext: "2 min walk · Rockefeller Center",
    description: "Blue Bottle Coffee serves precise espresso drinks, pour-overs, and a calm place to reset between stops.",
    discount_value: "15%",
    discount_type: "percentage_discount",
    context_tags: ["coffee", "espresso", "nearby"],
    why_now: "A polished coffee stop nearby.",
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
    taste_tag: "pizza",
    headline: "Classic New York slices, fresh from the oven.",
    subtext: "4 min walk · Greenwich Village",
    description: "Iconic New York slices since 1975, served hot with a crisp crust and classic counter-service energy.",
    discount_value: "10%",
    discount_type: "percentage_discount",
    context_tags: ["pizza", "nyc_classic"],
    why_now: "A classic slice shop nearby.",
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
    merchant_name: "Sugarfish",
    merchant_category: "restaurant",
    taste_tag: "sushi",
    headline: "Trust the chef. Stay for the hand rolls.",
    subtext: "6 min walk · Flatiron",
    description: "Nori-wrapped hand rolls and warm rice, served in a focused omakase-style format.",
    discount_value: "20%",
    discount_type: "percentage_discount",
    context_tags: ["sushi", "omakase", "dinner"],
    why_now: "A standout sushi counter nearby.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 40 * 60000).toISOString(),
    style: {
      background_gradient: ["#1a1a2e", "#6366F1"],
      emoji: "🍣",
      tone: "sophisticated",
      headline_style: "factual",
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
    taste_tag: "bakery",
    headline: "Warm cookies. No overthinking required.",
    subtext: "3 min walk · Upper West Side",
    description: "Their famous chocolate chip walnut cookie is rich, oversized, and baked with a crisp edge.",
    discount_value: "12%",
    discount_type: "percentage_discount",
    context_tags: ["bakery", "dessert", "cookies"],
    why_now: "A beloved bakery nearby.",
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
    taste_tag: "burgers",
    headline: "Burger break? ShackBurger is close.",
    subtext: "5 min walk · Madison Square Park",
    description: "ShackBurger, crinkle-cut fries, and frozen custard from a New York favorite.",
    discount_value: "8%",
    discount_type: "percentage_discount",
    context_tags: ["burgers", "fries", "casual"],
    why_now: "A dependable burger stop nearby.",
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
    taste_tag: "bubble_tea",
    headline: "Matcha, soft serve, and a little green calm.",
    subtext: "3 min walk · NoLIta",
    description: "Ceremonial-grade matcha drinks, bright flavors, and a playful cafe atmosphere.",
    discount_value: "15%",
    discount_type: "percentage_discount",
    context_tags: ["matcha", "cafe", "afternoon"],
    why_now: "A bright matcha stop nearby.",
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
    merchant_name: "Jack's Wife Freda",
    merchant_category: "restaurant",
    taste_tag: "brunch",
    headline: "Green shakshuka and rosewater waffles.",
    subtext: "5 min walk · SoHo",
    description: "Mediterranean-leaning brunch classics, rosewater waffles, and a warm neighborhood-diner feel.",
    discount_value: "15%",
    discount_type: "percentage_discount",
    context_tags: ["brunch", "mediterranean"],
    why_now: "A strong brunch pick nearby.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 35 * 60000).toISOString(),
    style: {
      background_gradient: ["#7C3AED", "#C084FC"],
      emoji: "🥑",
      tone: "warm",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 380,
    redemption_token: null,
  },
  {
    id: "off_mock_8",
    merchant_id: "m_008",
    merchant_name: "Los Tacos No. 1",
    merchant_category: "restaurant",
    taste_tag: "tacos",
    headline: "Adobada tacos, handmade tortillas.",
    subtext: "3 min walk · Chelsea Market",
    description: "Fresh corn tortillas, carne asada, and adobada carved to order in a fast, lively taqueria.",
    discount_value: "10%",
    discount_type: "percentage_discount",
    context_tags: ["tacos", "chelsea_market"],
    why_now: "A top taco counter nearby.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
    style: {
      background_gradient: ["#B45309", "#F59E0B"],
      emoji: "🌮",
      tone: "playful",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 290,
    redemption_token: null,
  },
  {
    id: "off_mock_9",
    merchant_id: "m_009",
    merchant_name: "Ichiran Ramen",
    merchant_category: "restaurant",
    taste_tag: "ramen",
    headline: "Tonkotsu ramen in a solo booth.",
    subtext: "7 min walk · Midtown West",
    description: "Hakata-style tonkotsu ramen with customizable richness, spice, noodles, and toppings.",
    discount_value: "12%",
    discount_type: "percentage_discount",
    context_tags: ["ramen", "tonkotsu", "dinner"],
    why_now: "A focused ramen stop nearby.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 50 * 60000).toISOString(),
    style: {
      background_gradient: ["#DC2626", "#F87171"],
      emoji: "🍜",
      tone: "warm",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 610,
    redemption_token: null,
  },
  {
    id: "off_mock_10",
    merchant_id: "m_010",
    merchant_name: "Van Leeuwen",
    merchant_category: "bakery",
    taste_tag: "desserts",
    headline: "Honeycomb scoops and classic favorites.",
    subtext: "4 min walk · East Village",
    description: "Artisanal ice cream with rich dairy and vegan flavors, from honeycomb to classic vanilla.",
    discount_value: "15%",
    discount_type: "percentage_discount",
    context_tags: ["dessert", "ice_cream"],
    why_now: "A polished dessert stop nearby.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 25 * 60000).toISOString(),
    style: {
      background_gradient: ["#DB2777", "#F9A8D4"],
      emoji: "🍦",
      tone: "playful",
      headline_style: "emotional",
    },
    status: "active",
    distance_meters: 450,
    redemption_token: null,
  },
  {
    id: "off_mock_11",
    merchant_id: "m_011",
    merchant_name: "Attaboy",
    merchant_category: "bar",
    taste_tag: "cocktails",
    headline: "No menu. Just tell them what you like.",
    subtext: "6 min walk · Lower East Side",
    description: "Speakeasy-style cocktails built around your preferences, with bartenders tailoring each drink.",
    discount_value: "18%",
    discount_type: "percentage_discount",
    context_tags: ["cocktails", "speakeasy", "evening"],
    why_now: "A refined cocktail bar nearby.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 45 * 60000).toISOString(),
    style: {
      background_gradient: ["#1E1B4B", "#4338CA"],
      emoji: "🍸",
      tone: "sophisticated",
      headline_style: "factual",
    },
    status: "active",
    distance_meters: 540,
    redemption_token: null,
  },
  {
    id: "off_mock_12",
    merchant_id: "m_012",
    merchant_name: "Sweetgreen",
    merchant_category: "restaurant",
    taste_tag: "healthy",
    headline: "Harvest bowls and crisp greens.",
    subtext: "2 min walk · Nomad",
    description: "Seasonal salads, warm bowls, and fresh add-ons built for a quick, lighter meal.",
    discount_value: "10%",
    discount_type: "percentage_discount",
    context_tags: ["healthy", "salad", "lunch"],
    why_now: "A quick healthy option nearby.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 18 * 60000).toISOString(),
    style: {
      background_gradient: ["#166534", "#4ADE80"],
      emoji: "🥗",
      tone: "warm",
      headline_style: "factual",
    },
    status: "active",
    distance_meters: 160,
    redemption_token: null,
  },
];

type ConsentStatus = "loading" | "none" | "granted" | "declined";

function getInitialConsentStatus(): ConsentStatus {
  const consent = getConsent();
  if (!consent) return "none";
  return consent.location_consent ? "granted" : "declined";
}

function useConsentStatus(): [ConsentStatus, (locationEnabled: boolean) => void] {
  const [status, setStatus] = useState<ConsentStatus>(getInitialConsentStatus);

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

function SwipeableOfferCard({
  offer,
  onAccept,
  onDismiss,
  onOpenDetails,
}: {
  offer: MockOffer;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onOpenDetails: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const suppressOpenRef = useRef(false);
  const suppressOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const offscreen = typeof window === "undefined" ? 480 : window.innerWidth + 120;
    animate(x, -offscreen, { type: "spring", stiffness: 360, damping: 36 }).then(() => {
      onDismiss(offer.id);
    });
  };

  const accept = () => {
    const offscreen = typeof window === "undefined" ? 480 : window.innerWidth + 120;
    animate(x, offscreen, { type: "spring", stiffness: 360, damping: 36 }).then(() => {
      onAccept(offer.id);
    });
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
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      className="relative mb-3 overflow-hidden rounded-4"
    >
      <div className="absolute inset-0 overflow-hidden rounded-4 bg-cw-paper-100 shadow-inner">
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
          <motion.button
            type="button"
            onClick={accept}
            className="flex items-center justify-start gap-2 px-5 text-small font-bold text-white"
            style={{ opacity: claimOpacity }}
          >
            <motion.span style={{ scale: claimScale, x: claimContentX }} className="inline-flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/18 shadow-1 backdrop-blur-sm">
                <i className="ph ph-ticket text-lg" />
              </span>
              <span>Claim</span>
            </motion.span>
          </motion.button>
          <motion.button
            type="button"
            onClick={dismiss}
            className="flex items-center justify-end gap-2 px-5 text-small font-bold text-white"
            style={{ opacity: dismissOpacity }}
          >
            <motion.span style={{ scale: dismissScale, x: dismissContentX }} className="inline-flex items-center gap-2">
              <span>Not now</span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 shadow-1 backdrop-blur-sm">
                <i className="ph ph-x text-lg" />
              </span>
            </motion.span>
          </motion.button>
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
  offer: MockOffer;
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
              {offer.style.emoji}
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
  const [consentStatus, handleConsent] = useConsentStatus();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOfferId) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedOfferId]);

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

  const allActive = mockOffers.filter((o) => !dismissed.has(o.id));
  const selectedOffer = allActive.find((o) => o.id === selectedOfferId) ?? null;

  const removeOffer = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const visibleOffers = categoryFilter === "all"
    ? allActive
    : allActive.filter((o) => o.taste_tag === categoryFilter);

  const displayOffers = visibleOffers.length > 0 ? visibleOffers : allActive;

  const availableTastes = new Set(
    allActive.map((o) => o.taste_tag).filter(Boolean)
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

      <div className="border-b border-border-1 bg-sunken px-5 py-3">
        <div className="flex items-center gap-2 text-small text-fg-3">
          <i className="ph ph-map-pin text-base text-cw-warm" />
          {consentStatus === "declined" ? "Times Square (default)" : "Near Columbia University"}
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
          {heading} {"·"} {displayOffers.length} offers
        </div>

        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {displayOffers.map((offer) => (
              <SwipeableOfferCard
                key={offer.id}
                offer={offer}
                onAccept={(id) => {
                  console.log("Accept:", id);
                  removeOffer(id);
                }}
                onDismiss={removeOffer}
                onOpenDetails={setSelectedOfferId}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />

      <AnimatePresence>
        {selectedOffer && (
          <OfferDetailsSheet
            key={selectedOffer.id}
            offer={selectedOffer}
            onClose={() => setSelectedOfferId(null)}
            onAccept={(id) => {
              console.log("Accept:", id);
              removeOffer(id);
            }}
            onDismiss={removeOffer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
