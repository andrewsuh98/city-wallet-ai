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

  useEffect(() => {
    const sid = getSessionId();
    if (!sid || !offerId) return;
    let alive = true;

    const fetchOffer = async () => {
      try {
        const res = await getOffers(sid);
        const found = res.offers.find((o) => o.id === offerId) ?? null;
        if (!alive) return;
        setOffer(found);
        if (found?.status === "redeemed" && cashback === null) {
          const wallet = await getWalletBalance(sid);
          if (!alive) return;
          const matched = wallet.redemptions.find((r) => r.offer_id === offerId);
          setCashback(matched?.cashback_amount ?? 0);
        }
      } catch {
        // network blip; keep last known offer state
      }
    };

    fetchOffer();
    const interval = setInterval(() => {
      if (!alive) return;
      fetchOffer();
    }, POLL_INTERVAL_MS);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [offerId, cashback]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = formatRemaining(offer?.expires_at ?? null);
  void tick;
  const isRedeemed = offer?.status === "redeemed";

  return (
    <div className="min-h-screen px-6 py-8">
      <button
        onClick={() => router.push("/wallet")}
        className="mb-6 text-sm text-white/60 hover:text-white"
      >
        Back to wallet
      </button>

      {offer && isRedeemed ? (
        <div className="mx-auto flex max-w-md flex-col items-center text-center animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-4xl text-emerald-300">
            v
          </div>
          <h1 className="mt-5 text-3xl font-bold text-white">Redeemed!</h1>
          <p className="mt-2 text-sm text-white/60">
            at {offer.merchant_name}
          </p>
          {cashback !== null && (
            <p className="mt-6 text-4xl font-bold tabular-nums text-emerald-400">
              +${cashback.toFixed(2)}
            </p>
          )}
          <p className="mt-1 text-sm text-white/50">cashback applied</p>
          <button
            onClick={() => router.push("/wallet")}
            className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:scale-105 active:scale-95 transition-transform"
          >
            Back to wallet
          </button>
        </div>
      ) : offer ? (
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <p className="text-xs uppercase tracking-wider text-white/50">
            {offer.merchant_name}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">{offer.headline}</h1>
          <span className="mt-3 inline-block rounded-full border border-blue-400/40 px-3 py-1 text-sm font-semibold text-blue-300">
            {offer.discount_value}
          </span>

          <div className="mt-8">
            <QRDisplay offerId={offerId} size={280} />
          </div>

          <p className="mt-6 text-sm text-white/70">
            Show this to the cashier
          </p>
          <p
            className={`mt-2 text-sm tabular-nums ${
              remaining.expired
                ? "text-red-400"
                : remaining.danger
                  ? "text-amber-300"
                  : "text-white/50"
            }`}
          >
            {remaining.expired ? "Expired" : `Expires in ${remaining.label}`}
          </p>
          <p className="mt-1 text-xs text-white/30">
            Waiting for merchant scan...
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-md text-center text-white/60">
          Loading offer...
        </div>
      )}
    </div>
  );
}
