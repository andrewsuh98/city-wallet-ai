"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import BottomNav from "@/components/BottomNav";
import { getMerchantAnalytics, getMerchants } from "@/lib/api";
import type { Merchant, OfferAnalytics } from "@/lib/types";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#1A1A1A] p-4">
      <p className="text-xs uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/60">{sub}</p>}
    </div>
  );
}

export default function MerchantDashboardPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [analytics, setAnalytics] = useState<OfferAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMerchants()
      .then((res) => {
        setMerchants(res.merchants);
        if (res.merchants.length > 0) setSelectedId(res.merchants[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setAnalytics(null);
    getMerchantAnalytics(selectedId)
      .then(setAnalytics)
      .catch((e: Error) => setError(e.message));
  }, [selectedId]);

  const fmtPct = (n: number) => `${(n * 100).toFixed(0)}%`;

  return (
    <div className="min-h-screen pb-24">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-white">Merchant dashboard</h1>
        <p className="text-sm text-white/60">Offer performance and redemptions</p>
      </header>

      <div className="space-y-5 px-5">
        {merchants.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-2xl bg-[#1A1A1A] px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-blue-400/50"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        {error && (
          <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!analytics && !error && (
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-2xl bg-[#1A1A1A]" />
            <div className="h-24 animate-pulse rounded-2xl bg-[#1A1A1A]" />
            <div className="h-24 animate-pulse rounded-2xl bg-[#1A1A1A]" />
            <div className="h-24 animate-pulse rounded-2xl bg-[#1A1A1A]" />
          </div>
        )}

        {analytics && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Generated" value={String(analytics.total_generated)} />
              <StatCard
                label="Accepted"
                value={String(analytics.total_accepted)}
                sub={`${fmtPct(analytics.acceptance_rate)} acceptance`}
              />
              <StatCard
                label="Redeemed"
                value={String(analytics.total_redeemed)}
                sub={`${fmtPct(analytics.redemption_rate)} redemption`}
              />
              <StatCard
                label="Revenue impact"
                value={`$${analytics.revenue_impact_estimate.toFixed(2)}`}
              />
            </div>

            <div className="rounded-2xl bg-[#1A1A1A] p-5">
              <p className="mb-3 text-xs uppercase tracking-wider text-white/50">
                Top context triggers
              </p>
              {analytics.top_context_triggers.length === 0 ? (
                <p className="text-sm text-white/50">No data yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {analytics.top_context_triggers.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#1A1A1A] p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-white/50">Declined</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-white/80">
                  {analytics.total_declined}
                </p>
              </div>
              <div className="rounded-2xl bg-[#1A1A1A] p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-white/50">Expired</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-white/80">
                  {analytics.total_expired}
                </p>
              </div>
            </div>

            {analytics.total_generated === 0 && (
              <div className="rounded-2xl bg-[#1A1A1A] p-5 text-sm text-white/60">
                No offers generated yet for this merchant. To test the redemption flow,
                run from the backend directory:{" "}
                <code className="block mt-2 rounded bg-black/40 px-2 py-1 font-mono text-xs">
                  python seed_test_offers.py &lt;session_id&gt;
                </code>
              </div>
            )}
          </>
        )}

        <Link
          href="/merchant/scan"
          className="block rounded-2xl bg-emerald-500 px-5 py-4 text-center text-sm font-semibold text-black hover:bg-emerald-400"
        >
          Scan QR to redeem
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
