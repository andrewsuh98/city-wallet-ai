"use client";

import { useState, useEffect } from "react";
import type { Offer } from "@/lib/types";

interface OfferCardProps {
  offer: Offer;
  onAccept?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  onShowQR?: (id: string) => void;
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  cafe: { label: "Coffee", icon: "ph-coffee" },
  restaurant: { label: "Food", icon: "ph-fork-knife" },
  bakery: { label: "Bakery", icon: "ph-cookie" },
  retail: { label: "Shopping", icon: "ph-storefront" },
  bar: { label: "Nightlife", icon: "ph-wine" },
  bookstore: { label: "Books", icon: "ph-book-open-text" },
  grocery: { label: "Grocery", icon: "ph-basket" },
  fitness: { label: "Fitness", icon: "ph-barbell" },
};

function formatMinutes(ms: number): string {
  if (ms <= 0) return "Ended";
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDiscount(value: string): string {
  if (!value) return "Deal";
  if (value.endsWith("%")) return `${value} off`;
  return value;
}

function urgencyLevel(ms: number): "ok" | "warning" | "danger" {
  if (ms <= 0) return "danger";
  const mins = ms / 60000;
  if (mins < 5) return "danger";
  if (mins < 15) return "warning";
  return "ok";
}

function extractNeighborhood(subtext: string): string {
  const parts = subtext.split("·");
  return parts.length > 1 ? parts[1].trim() : subtext;
}

export default function OfferCard({ offer, onAccept, onDismiss, onOpenDetails, onShowQR }: OfferCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const expiresMs = new Date(offer.expires_at).getTime() - now;
  const isExpired = expiresMs <= 0;
  const isActive = !isExpired && offer.status === "active";
  const urgency = urgencyLevel(expiresMs);

  const expiryLabel = formatMinutes(expiresMs);
  const discountLabel = formatDiscount(offer.discount_value);
  const meta = CATEGORY_META[offer.merchant_category];
  const categoryLabel = meta?.label ?? offer.merchant_category;
  const categoryIcon = meta?.icon ?? "ph-storefront";
  const neighborhood = extractNeighborhood(offer.subtext);

  const timerColor =
    urgency === "danger" ? "bg-cw-red-100 text-status-danger" :
    urgency === "warning" ? "bg-cw-warm-bg text-status-warning" :
    "bg-cw-paper-100 text-fg-3";

  return (
    <article
      className={`group relative overflow-hidden rounded-4 border border-border-1 bg-card transition-all duration-200 ${
        isActive ? "shadow-2 hover:-translate-y-0.5 hover:shadow-3 active:translate-y-0 active:shadow-press cursor-pointer" : "shadow-1"
      } ${isExpired ? "opacity-50" : ""}`}
      style={{ transitionTimingFunction: "var(--ease-out)" }}
    >
      {/* === TOP ZONE: Info === */}
      <div className="p-4 pb-3" onClick={() => isActive && onOpenDetails?.(offer.id)}>
        {/* Row 1: Category tag + Timer */}
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-2 border border-border-1 bg-cw-paper-50 px-2.5 py-1 text-small font-semibold text-fg-2">
            <i className={`ph ${categoryIcon} text-sm`} />
            {categoryLabel}
          </span>

          {!isExpired && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-2 px-2.5 py-1 font-mono text-[12px] font-semibold ${timerColor} ${
                urgency === "danger" ? "animate-[wiggle_0.5s_ease-in-out_3]" : ""
              }`}
            >
              <i className="ph ph-clock text-xs" />
              {expiryLabel}
              {urgency === "danger" && (
                <span className="relative ml-0.5 flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cw-red-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cw-red-500" />
                </span>
              )}
            </span>
          )}
        </div>

        {/* Row 2: Merchant name */}
        <h3 className="mb-1 text-h3 font-semibold text-fg-1">
          {offer.merchant_name}
        </h3>

        {/* Row 3: Headline */}
        <p
          className="mb-3 font-display text-[17px] font-medium leading-snug text-fg-2"
          style={{ fontVariationSettings: '"opsz" 60, "SOFT" 40', textWrap: "balance" }}
        >
          {offer.headline}
        </p>

        {/* Row 4: Info pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {offer.distance_meters != null && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-cw-paper-100 px-2.5 py-1 text-micro font-semibold text-fg-3">
              <i className="ph ph-map-pin text-[11px]" />
              {formatDistance(offer.distance_meters)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-pill bg-cw-paper-100 px-2.5 py-1 text-micro font-semibold text-fg-3">
            <i className="ph ph-map-trifold text-[11px]" />
            {neighborhood}
          </span>
          <span className="inline-flex items-center gap-1 rounded-pill bg-cw-red-50 px-2.5 py-1 text-micro font-bold text-cw-red-600">
            <i className="ph ph-tag text-[11px]" />
            {discountLabel}
          </span>
        </div>
      </div>

      {/* === TEAR LINE === */}
      {isActive && (
        <>
          <div className="ticket-tear relative border-t-2 border-dashed border-cw-paper-200" />

          {/* === BOTTOM ZONE: Stub === */}
          <div className="flex items-center justify-between bg-cw-paper-50 px-4 py-3">
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss?.(offer.id); }}
              className="text-small text-fg-4 transition-colors duration-150 hover:text-fg-2"
            >
              Not now
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAccept?.(offer.id); }}
              className="group/cta inline-flex items-center gap-2 rounded-3 bg-action-primary px-5 py-2.5 text-body font-bold text-fg-on-red shadow-1 transition-all duration-200 hover:bg-action-primary-hover hover:shadow-2 active:bg-action-primary-press active:shadow-press"
              style={{
                backgroundImage: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
                backgroundSize: "200% 100%",
                backgroundPosition: "-200% center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.animation = "shimmer 0.8s ease-out forwards";
              }}
              onAnimationEnd={(e) => {
                (e.currentTarget as HTMLElement).style.animation = "";
                (e.currentTarget as HTMLElement).style.backgroundPosition = "-200% center";
              }}
            >
              <i className="ph ph-ticket text-lg" />
              Claim this deal
              <i className="ph ph-arrow-right text-base transition-transform duration-150 group-hover/cta:translate-x-0.5" />
            </button>
          </div>
        </>
      )}

      {/* === Accepted state === */}
      {offer.status === "accepted" && (
        <>
          <div className="ticket-tear relative border-t-2 border-dashed border-cw-paper-200" />
          <div className="flex items-center justify-between bg-cw-fresh-bg/50 px-4 py-3">
            <span className="inline-flex items-center gap-1.5 text-small font-semibold text-status-success">
              <i className="ph ph-check-circle text-base" />
              Claimed
            </span>
            {onShowQR && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowQR(offer.id); }}
                className="inline-flex items-center gap-1.5 rounded-2 bg-action-secondary px-3.5 py-2 text-small font-semibold text-fg-on-dark transition-colors duration-150 hover:bg-action-secondary-hover"
              >
                <i className="ph ph-qr-code text-sm" />
                Show QR
              </button>
            )}
          </div>
        </>
      )}

      {/* === Expired: no stub === */}
      {isExpired && offer.status !== "accepted" && (
        <div className="border-t border-border-1 px-4 py-2.5">
          <span className="text-micro text-fg-4">This offer has ended</span>
        </div>
      )}
    </article>
  );
}
