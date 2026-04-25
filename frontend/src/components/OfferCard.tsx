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

const CHIP_CLASSES: Record<ChipVariant, string> = {
  cool:    "bg-cw-cool-bg text-cw-cool",
  warm:    "bg-cw-warm-bg text-cw-warm",
  fresh:   "bg-cw-fresh-bg text-cw-fresh",
  dusk:    "bg-cw-dusk-bg text-cw-dusk",
  neutral: "bg-cw-paper-100 text-fg-2",
};

const CHIP_BASE =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.04em]";

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
  const tagIcon = (primaryTag ? TAG_ICON[primaryTag] : undefined) ?? "ph-tag";
  const tagLabel = (primaryTag ?? "").replace(/_/g, " ");

  const merchantInitial = offer.merchant_name.charAt(0).toUpperCase();
  const expiry = formatExpiry(offer.expires_at);
  const discountLabel = formatDiscount(offer.discount_value);

  return (
    <article
      className={`rounded-4 border border-border-1 bg-card p-[18px] transition-shadow duration-200 ${
        isActive ? "shadow-2" : "shadow-1"
      } ${isExpired ? "opacity-50" : ""}`}
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {primaryTag && (
          <span className={`${CHIP_BASE} ${CHIP_CLASSES[variant]}`}>
            <i className={`ph ${tagIcon} text-xs`} />
            {tagLabel}
          </span>
        )}
        {offer.distance_meters != null && (
          <span className={`${CHIP_BASE} ${CHIP_CLASSES.neutral}`}>
            <i className="ph ph-map-pin text-xs" />
            {formatDistance(offer.distance_meters)}
          </span>
        )}
      </div>

      <h3
        className="mb-2 font-display text-[26px] font-medium leading-[1.05] text-fg-1"
        style={{ letterSpacing: "var(--ls-tight)", textWrap: "balance", fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
      >
        {offer.headline}
      </h3>

      <div className="mb-4 text-small text-fg-3">
        {offer.subtext}
        {!isExpired && <> {"\u00b7"} {expiry}</>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cw-paper-200 font-display text-[14px] font-semibold text-fg-2">
            {merchantInitial}
          </div>
          <div className="min-w-0">
            <div className="truncate text-small font-semibold text-fg-1">
              {offer.merchant_name}
            </div>
            <div className="text-micro text-fg-3">
              {offer.merchant_category}
            </div>
          </div>
        </div>

        {isActive ? (
          <button
            onClick={() => onAccept?.(offer.id)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2 bg-action-primary px-3.5 py-2 text-small font-semibold text-fg-on-red transition-colors duration-150 hover:bg-action-primary-hover active:bg-action-primary-press"
          >
            {discountLabel}
            <i className="ph ph-arrow-right text-sm" />
          </button>
        ) : offer.status === "accepted" && onShowQR ? (
          <button
            onClick={() => onShowQR(offer.id)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2 bg-action-secondary px-3.5 py-2 text-small font-semibold text-fg-on-dark"
          >
            <i className="ph ph-qr-code text-sm" />
            Show QR
          </button>
        ) : offer.status === "accepted" ? (
          <span className="rounded-pill bg-cw-fresh-bg px-3 py-1.5 text-small font-semibold text-status-success">
            Accepted
          </span>
        ) : (
          <span className="text-small text-fg-3">Window closed</span>
        )}
      </div>

      {isActive && (
        <div className="mt-2.5 text-right">
          <button
            onClick={() => onDismiss?.(offer.id)}
            className="text-small text-fg-3 hover:text-fg-2"
          >
            Maybe later
          </button>
        </div>
      )}
    </article>
  );
}
