"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div className="rounded-3 border border-border-1 bg-card p-4 shadow-1">
      <p className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">{label}</p>
      <p
        className="mt-1 font-display text-h1 tabular-nums text-fg-1"
        style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 60, "SOFT" 30' }}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-small text-fg-3">{sub}</p>}
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
    <div className="min-h-screen bg-page pb-12">
      <header className="border-b border-border-1 px-5 pt-10 pb-5">
        <div className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
          Merchant
        </div>
        <h1
          className="mt-1 font-display text-h1 leading-snug text-fg-1"
          style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 60, "SOFT" 30' }}
        >
          Offer performance and redemptions
        </h1>
      </header>

      <div className="space-y-5 px-5 pt-5">
        {merchants.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-2 border border-border-2 bg-card px-4 py-3 text-body text-fg-1 outline-none focus:border-action-primary"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        {error && (
          <div className="rounded-3 border border-status-danger/30 bg-cw-red-50 p-4 text-small text-status-danger">
            {error}
          </div>
        )}

        {!analytics && !error && (
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-3 bg-card-soft" />
            <div className="h-24 animate-pulse rounded-3 bg-card-soft" />
            <div className="h-24 animate-pulse rounded-3 bg-card-soft" />
            <div className="h-24 animate-pulse rounded-3 bg-card-soft" />
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

            <div className="rounded-4 border border-border-1 bg-card p-5 shadow-1">
              <p className="mb-3 text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
                Top context triggers
              </p>
              {analytics.top_context_triggers.length === 0 ? (
                <p className="text-small text-fg-3">No data yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {analytics.top_context_triggers.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-pill bg-cw-cool-bg px-3 py-1 text-micro font-semibold uppercase tracking-[0.04em] text-cw-cool"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3 border border-border-1 bg-card p-4 text-center shadow-1">
                <p className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">Declined</p>
                <p className="mt-1 font-display text-h2 tabular-nums text-fg-2">
                  {analytics.total_declined}
                </p>
              </div>
              <div className="rounded-3 border border-border-1 bg-card p-4 text-center shadow-1">
                <p className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">Expired</p>
                <p className="mt-1 font-display text-h2 tabular-nums text-fg-2">
                  {analytics.total_expired}
                </p>
              </div>
            </div>

            {analytics.total_generated === 0 && (
              <div className="rounded-3 border border-border-1 bg-card-soft p-5 text-small text-fg-2">
                No offers generated yet for this merchant. To test the redemption flow,
                run from the backend directory:{" "}
                <code className="mt-2 block rounded-2 bg-cw-paper-900 px-2 py-1 font-mono text-micro text-fg-on-dark">
                  python seed_test_offers.py &lt;session_id&gt;
                </code>
              </div>
            )}
          </>
        )}

        <Link
          href="/merchant/scan"
          className="block rounded-2 bg-action-primary px-5 py-4 text-center text-body font-semibold text-fg-on-red no-underline hover:bg-action-primary-hover"
        >
          Scan QR to redeem
        </Link>
      </div>
    </div>
  );
}
