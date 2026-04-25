import type { Offer } from "@/lib/types";

interface OfferCardProps {
  offer: Offer;
  onAccept?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const minutes = Math.ceil(diff / 60000);
  return `${minutes}m`;
}

const toneClasses: Record<string, string> = {
  warm: "animate-fade-in",
  urgent: "animate-slide-up",
  playful: "animate-bounce-in",
  sophisticated: "animate-fade-in",
};

export default function OfferCard({ offer, onAccept, onDismiss }: OfferCardProps) {
  const gradient = `linear-gradient(135deg, ${offer.style.background_gradient[0]}, ${offer.style.background_gradient[1]})`;
  const timeLeft = getTimeRemaining(offer.expires_at);
  const isExpired = timeLeft === "Expired";

  return (
    <div
      className={`relative rounded-2xl p-5 shadow-lg ${toneClasses[offer.style.tone] || ""} ${isExpired ? "opacity-50" : ""}`}
      style={{ background: gradient }}
    >
      {/* Top row: emoji + badges */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-5xl leading-none">{offer.style.emoji}</span>
        <div className="flex gap-2">
          {offer.distance_meters != null && (
            <span className="rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white/90">
              {offer.distance_meters < 1000
                ? `${Math.round(offer.distance_meters)}m`
                : `${(offer.distance_meters / 1000).toFixed(1)}km`}
            </span>
          )}
        </div>
      </div>

      {/* Headline */}
      <h3
        className={`mb-1 leading-tight text-white ${
          offer.style.headline_style === "emotional"
            ? "text-2xl font-bold"
            : "text-xl font-semibold"
        }`}
      >
        {offer.headline}
      </h3>

      {/* Subtext */}
      <p className="text-base font-medium text-white/90 mb-4">{offer.subtext}</p>

      {/* Bottom row: CTA + expiry */}
      <div className="flex items-center justify-between">
        {!isExpired && offer.status === "active" ? (
          <button
            onClick={() => onAccept?.(offer.id)}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
          >
            Accept
          </button>
        ) : offer.status === "accepted" ? (
          <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-300">
            Accepted
          </span>
        ) : (
          <span className="text-sm text-white/50">Expired</span>
        )}

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium ${
              isExpired
                ? "text-white/40"
                : timeLeft <= "5m"
                  ? "text-red-300"
                  : "text-white/70"
            }`}
          >
            {isExpired ? "Expired" : `expires in ${timeLeft}`}
          </span>
          {!isExpired && offer.status === "active" && (
            <button
              onClick={() => onDismiss?.(offer.id)}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
