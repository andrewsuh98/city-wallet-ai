import type { CSSProperties, MouseEvent } from "react";
import type { Offer } from "@/lib/types";

interface OfferCardProps {
  offer: Offer;
  onAccept?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onShowQR?: (id: string) => void;
}

type ChipVariant = "cool" | "warm" | "fresh" | "dusk" | "neutral";

const TAG_VARIANT: Record<string, ChipVariant> = {
  rainy: "cool",
  rain: "cool",
  cold: "cool",
  snow: "cool",
  storm: "cool",
  sunny: "warm",
  warm: "warm",
  hot: "warm",
  fresh: "fresh",
  available: "fresh",
  quiet: "fresh",
  quiet_cafes: "fresh",
  quiet_period: "fresh",
  evening: "dusk",
  dusk: "dusk",
  events: "dusk",
  concert: "dusk",
  weekend: "dusk",
};

const TAG_ICON: Record<string, string> = {
  rainy: "ph-cloud-rain",
  rain: "ph-cloud-rain",
  cold: "ph-thermometer-cold",
  snow: "ph-snowflake",
  storm: "ph-cloud-lightning",
  sunny: "ph-sun",
  warm: "ph-sun",
  hot: "ph-sun",
  fresh: "ph-coffee",
  quiet: "ph-chart-bar",
  quiet_cafes: "ph-coffee",
  quiet_period: "ph-chart-bar",
  lunch_hour: "ph-fork-knife",
  weekend: "ph-calendar",
  evening: "ph-moon",
  dusk: "ph-moon",
  events: "ph-music-notes",
  concert: "ph-music-notes",
};

const CHIP_STYLE: Record<ChipVariant, { background: string; color: string }> = {
  cool:    { background: "var(--cw-cool-bg)",   color: "var(--cw-cool)" },
  warm:    { background: "var(--cw-warm-bg)",   color: "var(--cw-warm)" },
  fresh:   { background: "var(--cw-fresh-bg)",  color: "var(--cw-fresh)" },
  dusk:    { background: "var(--cw-dusk-bg)",   color: "var(--cw-dusk)" },
  neutral: { background: "var(--cw-paper-100)", color: "var(--fg-2)" },
};

const chipBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "4px 9px",
  borderRadius: "var(--radius-pill)",
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

function pickPrimaryTag(tags: string[]): string | null {
  for (const tag of tags) {
    if (TAG_VARIANT[tag] || TAG_ICON[tag]) return tag;
  }
  return tags[0] ?? null;
}

function formatExpiry(expiresAt: string): string {
  const target = new Date(expiresAt);
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "closed";
  const h = target.getHours().toString().padStart(2, "0");
  const m = target.getMinutes().toString().padStart(2, "0");
  return `until ${h}:${m}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDiscount(value: string): string {
  if (!value) return "Accept";
  if (value.startsWith("\u2212") || value.startsWith("-")) return value;
  if (value.endsWith("%")) return `\u2212${value}`;
  return value;
}

export default function OfferCard({ offer, onAccept, onDismiss, onShowQR }: OfferCardProps) {
  const expiresMs = new Date(offer.expires_at).getTime() - Date.now();
  const isExpired = expiresMs <= 0;
  const isActive = !isExpired && offer.status === "active";

  const primaryTag = pickPrimaryTag(offer.context_tags);
  const variant: ChipVariant = (primaryTag ? TAG_VARIANT[primaryTag] : undefined) ?? "neutral";
  const chipColor = CHIP_STYLE[variant];
  const tagIcon = (primaryTag ? TAG_ICON[primaryTag] : undefined) ?? "ph-tag";
  const tagLabel = (primaryTag ?? "").replace(/_/g, " ");

  const merchantInitial = offer.merchant_name.charAt(0).toUpperCase();
  const expiry = formatExpiry(offer.expires_at);
  const discountLabel = formatDiscount(offer.discount_value);

  return (
    <article
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-4)",
        padding: "18px",
        border: "1px solid var(--border-1)",
        boxShadow: isActive ? "var(--shadow-2)" : "var(--shadow-1)",
        opacity: isExpired ? 0.5 : 1,
        transition: `box-shadow var(--dur-2) var(--ease-out)`,
      }}
    >
      {/* Context chips */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
        {primaryTag && (
          <span style={{ ...chipBase, ...chipColor }}>
            <i className={`ph ${tagIcon}`} style={{ fontSize: "12px" }} />
            {tagLabel}
          </span>
        )}
        {offer.distance_meters != null && (
          <span style={{ ...chipBase, ...CHIP_STYLE.neutral }}>
            <i className="ph ph-map-pin" style={{ fontSize: "12px" }} />
            {formatDistance(offer.distance_meters)}
          </span>
        )}
      </div>

      {/* Hero */}
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "26px",
          lineHeight: "1.05",
          letterSpacing: "var(--ls-tight)",
          fontWeight: 500,
          color: "var(--fg-1)",
          margin: "0 0 8px",
          fontVariationSettings: '"opsz" 96, "SOFT" 50',
          textWrap: "balance",
        }}
      >
        {offer.headline}
      </h3>

      {/* Meta */}
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-small)",
          color: "var(--fg-3)",
          marginBottom: "16px",
        }}
      >
        {offer.subtext}
        {!isExpired && <> {"\u00b7"} {expiry}</>}
      </div>

      {/* Bottom row: merchant + CTA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--cw-paper-200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: "var(--fg-2)",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            {merchantInitial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-small)",
                fontWeight: 600,
                color: "var(--fg-1)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {offer.merchant_name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-micro)",
                color: "var(--fg-3)",
              }}
            >
              {offer.merchant_category}
            </div>
          </div>
        </div>

        {isActive ? (
          <button
            onClick={() => onAccept?.(offer.id)}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-small)",
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: "var(--radius-2)",
              background: "var(--action-primary)",
              color: "var(--fg-on-red)",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              transition: `background var(--dur-1) var(--ease-out)`,
            }}
            onMouseDown={(e: MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = "var(--action-primary-press)")}
            onMouseUp={(e: MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = "var(--action-primary)")}
            onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = "var(--action-primary)")}
          >
            {discountLabel}
            <i className="ph ph-arrow-right" style={{ fontSize: "14px" }} />
          </button>
        ) : offer.status === "accepted" && onShowQR ? (
          <button
            onClick={() => onShowQR(offer.id)}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-small)",
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: "var(--radius-2)",
              background: "var(--action-secondary)",
              color: "var(--fg-on-dark)",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            <i className="ph ph-qr-code" style={{ fontSize: "14px" }} />
            Show QR
          </button>
        ) : offer.status === "accepted" ? (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-small)",
              fontWeight: 600,
              color: "var(--status-success)",
              padding: "6px 12px",
              borderRadius: "var(--radius-pill)",
              background: "var(--cw-fresh-bg)",
            }}
          >
            Accepted
          </span>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-small)",
              color: "var(--fg-3)",
            }}
          >
            Window closed
          </span>
        )}
      </div>

      {isActive && (
        <div style={{ marginTop: "10px", textAlign: "right" }}>
          <button
            onClick={() => onDismiss?.(offer.id)}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-small)",
              color: "var(--fg-3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Maybe later
          </button>
        </div>
      )}
    </article>
  );
}
