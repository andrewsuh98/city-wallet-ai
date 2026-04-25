"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import BottomNav from "@/components/BottomNav";
import CashbackBalance from "@/components/CashbackBalance";
import OfferCard from "@/components/OfferCard";
import { getOffers, getWalletBalance, type WalletRedemption } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import type { Offer } from "@/lib/types";

export default function WalletPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [balance, setBalance] = useState(0);
  const [redemptionCount, setRedemptionCount] = useState(0);
  const [redemptions, setRedemptions] = useState<WalletRedemption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;
    Promise.all([getOffers(sid), getWalletBalance(sid)])
      .then(([offersRes, walletRes]) => {
        setOffers(offersRes.offers);
        setBalance(walletRes.balance_usd);
        setRedemptionCount(walletRes.redemption_count);
        setRedemptions(walletRes.redemptions);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const accepted = offers?.filter((o) => o.status === "accepted") ?? [];
  const redeemed = offers?.filter((o) => o.status === "redeemed") ?? [];
  const expired = offers?.filter((o) => o.status === "expired") ?? [];

  const cashbackByOfferId = new Map(
    redemptions.map((r) => [r.offer_id, r.cashback_amount]),
  );

  return (
    <div className="min-h-screen pb-24">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <p className="text-sm text-white/60">Your accepted offers and cashback</p>
      </header>

      <div className="space-y-6 px-5">
        <CashbackBalance balanceUsd={balance} redemptionCount={redemptionCount} />

        {error && (
          <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {offers === null && !error && (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-2xl bg-[#1A1A1A]" />
            <div className="h-32 animate-pulse rounded-2xl bg-[#1A1A1A]" />
          </div>
        )}

        {offers !== null && offers.length === 0 && (
          <div className="rounded-2xl bg-[#1A1A1A] p-6 text-center">
            <p className="mb-3 text-white/70">No offers yet.</p>
            <Link
              href="/"
              className="inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
            >
              Discover offers
            </Link>
          </div>
        )}

        {accepted.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Ready to use
            </h2>
            <div className="space-y-3">
              {accepted.map((o) => (
                <OfferCard
                  key={o.id}
                  offer={o}
                  onShowQR={(id) => router.push(`/redeem/${id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {redeemed.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Redeemed
            </h2>
            <div className="space-y-2">
              {redeemed.map((o) => {
                const cashback = cashbackByOfferId.get(o.id) ?? 0;
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-2xl bg-[#1A1A1A] p-4"
                  >
                    <div>
                      <p className="font-semibold text-white">{o.merchant_name}</p>
                      <p className="text-xs text-white/50">{o.headline}</p>
                    </div>
                    <p className="font-bold tabular-nums text-emerald-400">
                      +${cashback.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {expired.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
              Expired
            </h2>
            <div className="space-y-2 opacity-60">
              {expired.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl bg-[#1A1A1A] p-4 text-sm text-white/60"
                >
                  <span className="font-semibold">{o.merchant_name}</span>
                  <span className="ml-2 text-white/40">{o.headline}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
