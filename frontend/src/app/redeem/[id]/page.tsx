"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import QRDisplay from "@/components/QRDisplay";
import { getOffers, getWalletBalance } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import type { Offer } from "@/lib/types";

const POLL_INTERVAL_MS = 2000;

function formatRemaining(expiresAt: string | null): { label: string; danger: boolean; expired: boolean } {
  if (!expiresAt) return { label: "", danger: false, expired: false };
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { label: "Expired", danger: true, expired: true };
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    label: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    danger: minutes < 5,
    expired: false,
  };
}

export default function RedeemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const offerId = params.id;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [cashback, setCashback] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid || !offerId) return;
    let alive = true;
    let interval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;

    const stop = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };

    const fetchOffer = async () => {
      try {
        const res = await getOffers(sid);
        const found = res.offers.find((o) => o.id === offerId) ?? null;
        if (!alive) return;
        if (found) {
          setOffer(found);
          setNotFound(false);
          if (found.status === "redeemed") {
            stop();
            const wallet = await getWalletBalance(sid);
            if (!alive) return;
            const matched = wallet.redemptions.find((r) => r.offer_id === offerId);
            setCashback(matched?.cashback_amount ?? 0);
          }
        } else {
          attempts += 1;
          // After ~3 polls (6s) with no match, surface an error instead of looping forever.
          if (attempts >= 3 && !offer) {
            setNotFound(true);
            stop();
          }
        }
      } catch {
        // network blip; keep last known offer state
      }
    };

    fetchOffer();
    interval = setInterval(fetchOffer, POLL_INTERVAL_MS);

    return () => {
      alive = false;
      stop();
    };
  }, [offerId, offer]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = formatRemaining(offer?.expires_at ?? null);
  void tick;
  const isRedeemed = offer?.status === "redeemed";

  const remainingClass = remaining.expired
    ? "text-status-danger"
    : remaining.danger
      ? "text-cw-warm"
      : "text-fg-3";

  return (
    <div className="min-h-screen bg-page px-6 py-8">
      <button
        onClick={() => router.push("/wallet")}
        className="mb-6 inline-flex items-center gap-1 text-small text-fg-link hover:opacity-80"
      >
        <i className="ph ph-arrow-left text-xs" />
        Back to wallet
      </button>

      {offer && isRedeemed ? (
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-pill bg-cw-fresh-bg text-cw-fresh">
            <i className="ph-bold ph-check text-4xl" />
          </div>
          <h1
            className="mt-5 font-display text-display text-fg-1"
            style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
          >
            Redeemed
          </h1>
          <p className="mt-2 text-small text-fg-3">
            at {offer.merchant_name}
          </p>
          {cashback !== null && (
            <p
              className="mt-6 font-display text-hero tabular-nums text-cw-fresh"
              style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
            >
              +${cashback.toFixed(2)}
            </p>
          )}
          <p className="mt-1 text-small text-fg-3">cashback applied</p>
          <button
            onClick={() => router.push("/wallet")}
            className="mt-8 rounded-2 bg-action-primary px-6 py-3 text-small font-semibold text-fg-on-red hover:bg-action-primary-hover"
          >
            Back to wallet
          </button>
        </div>
      ) : offer ? (
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <p className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
            {offer.merchant_name}
          </p>
          <h1
            className="mt-1 font-display text-h1 text-fg-1"
            style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
          >
            {offer.headline}
          </h1>
          <span className="mt-3 inline-block rounded-pill bg-cw-cool-bg px-3 py-1 text-small font-semibold text-cw-cool">
            {offer.discount_value}
          </span>

          <div className="mt-8">
            <QRDisplay offerId={offerId} size={280} />
          </div>

          <p className="mt-6 text-body text-fg-2">
            Show this to the cashier
          </p>
          <p className={`mt-2 text-small tabular-nums font-semibold ${remainingClass}`}>
            {remaining.expired ? "Expired" : `Expires in ${remaining.label}`}
          </p>
          <p className="mt-1 text-micro text-fg-4">
            Waiting for merchant scan...
          </p>
        </div>
      ) : notFound ? (
        <div className="mx-auto max-w-md text-center">
          <p className="text-body text-fg-2">
            This offer is not available for redemption.
          </p>
          <p className="mt-2 text-small text-fg-3">
            It may have expired or been generated in demo fallback mode.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-2 bg-action-primary px-6 py-3 text-small font-semibold text-fg-on-red hover:bg-action-primary-hover"
          >
            Back to offers
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-md text-center text-small text-fg-3">
          Loading offer...
        </div>
      )}
    </div>
  );
}
