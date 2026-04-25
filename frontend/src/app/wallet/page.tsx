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
    <div className="min-h-screen bg-page pb-24">
      <header className="px-5 pt-10 pb-5">
        <div className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
          Wallet
        </div>
        <h1
          className="mt-1 font-display text-h1 leading-snug text-fg-1"
          style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 60, "SOFT" 30' }}
        >
          Your offers and cashback
        </h1>
      </header>

      <div className="space-y-6 px-5">
        <CashbackBalance balanceUsd={balance} redemptionCount={redemptionCount} />

        {error && (
          <div className="rounded-3 border border-status-danger/30 bg-cw-red-50 p-4 text-small text-status-danger">
            {error}
          </div>
        )}

        {offers === null && !error && (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-4 bg-card-soft" />
            <div className="h-32 animate-pulse rounded-4 bg-card-soft" />
          </div>
        )}

        {offers !== null && offers.length === 0 && (
          <div className="rounded-4 border border-border-1 bg-card p-6 text-center shadow-1">
            <p className="mb-4 text-body text-fg-2">No offers yet.</p>
            <Link
              href="/"
              className="inline-block rounded-2 bg-action-primary px-5 py-2 text-small font-semibold text-fg-on-red no-underline"
            >
              Discover offers
            </Link>
          </div>
        )}

        {accepted.length > 0 && (
          <section>
            <h2 className="mb-3 text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
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
            <h2 className="mb-3 text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
              Redeemed
            </h2>
            <div className="space-y-2">
              {redeemed.map((o) => {
                const cashback = cashbackByOfferId.get(o.id) ?? 0;
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-3 border border-border-1 bg-card p-4 shadow-1"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body font-semibold text-fg-1">{o.merchant_name}</p>
                      <p className="truncate text-small text-fg-3">{o.headline}</p>
                    </div>
                    <p className="font-display text-h3 tabular-nums text-cw-fresh">
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
            <h2 className="mb-3 text-micro font-semibold uppercase tracking-[0.08em] text-fg-4">
              Expired
            </h2>
            <div className="space-y-2 opacity-60">
              {expired.map((o) => (
                <div
                  key={o.id}
                  className="rounded-3 border border-border-1 bg-card-soft p-4 text-small text-fg-3"
                >
                  <span className="font-semibold text-fg-2">{o.merchant_name}</span>
                  <span className="ml-2 text-fg-4">{o.headline}</span>
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
