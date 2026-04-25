"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import BottomNav from "@/components/BottomNav";
import { getMerchantDashboard, patchMerchantCampaign, patchMerchantRules } from "@/lib/api";
import type { MerchantDashboardStats, MerchantCategory } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<MerchantCategory, string> = {
  cafe: "☕",
  restaurant: "🍽️",
  retail: "🛍️",
  bakery: "🥐",
  bar: "🍺",
  bookstore: "📚",
  grocery: "🛒",
  fitness: "💪",
};

const HOUR_LABEL = (h: number) => {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 flex flex-col gap-1">
      <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
        {label}
      </span>
      <span
        className={`text-2xl font-bold leading-tight ${accent ? "text-[#34D399]" : "text-white"}`}
      >
        {value}
      </span>
      <span className="text-xs text-white/40 leading-snug">{sub}</span>
    </div>
  );
}

type TrendTab = "revenue" | "redemptions" | "acceptance";

function TrendChart({ stats }: { stats: MerchantDashboardStats }) {
  const [tab, setTab] = useState<TrendTab>("revenue");

  const dataKey =
    tab === "revenue"
      ? "revenue_usd"
      : tab === "redemptions"
      ? "redemptions"
      : "avg_discount_pct";

  const formatter = (v: number) =>
    tab === "revenue"
      ? `$${v.toFixed(0)}`
      : tab === "redemptions"
      ? `${v}`
      : `${v.toFixed(1)}%`;

  const chartColor = tab === "redemptions" ? "#34D399" : "#4F8CFF";

  const tabs: { key: TrendTab; label: string }[] = [
    { key: "revenue", label: "Revenue" },
    { key: "redemptions", label: "Redemptions" },
    { key: "acceptance", label: "Avg Discount" },
  ];

  const shortDate = (d: string) => {
    const [, m, day] = d.split("-");
    return `${parseInt(m)}/${parseInt(day)}`;
  };

  const chartData = stats.daily_series.map((d) => ({
    ...d,
    label: shortDate(d.date),
  }));

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">30-Day Trend</h2>
          <p className="text-xs text-white/40 mt-0.5">Trailing {stats.period_days} days</p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                tab === t.key
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatter}
          />
          <Tooltip
            contentStyle={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
              color: "#fff",
            }}
            formatter={(v) => [formatter(Number(v ?? 0)), tab === "revenue" ? "Revenue" : tab === "redemptions" ? "Redemptions" : "Avg Discount"]}
            labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}
            cursor={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={chartColor}
            strokeWidth={2}
            fill="url(#chartFill)"
            dot={false}
            activeDot={{ r: 4, fill: chartColor, stroke: "#111", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DowntimeChart({ stats }: { stats: MerchantDashboardStats }) {
  const deadRanges = stats.dead_hour_ranges;

  const chartData = stats.hourly_redemptions.map((h) => ({
    hour: h.hour,
    label: HOUR_LABEL(h.hour),
    count: h.count,
  }));

  const totalInDeadZone = stats.hourly_redemptions
    .filter((h) => deadRanges.some(([s, e]) => h.hour >= s && h.hour < e))
    .reduce((sum, h) => sum + h.count, 0);
  const totalAll = stats.hourly_redemptions.reduce((sum, h) => sum + h.count, 0);
  const pct = totalAll > 0 ? Math.round((totalInDeadZone / totalAll) * 100) : 0;

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Filling Your Slow Hours</h2>
          <p className="text-xs text-white/40 mt-0.5">Redemptions by hour of day</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-[#34D399]">{pct}%</span>
          <p className="text-[10px] text-white/40">in target window</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-white/10" />
          Target slow hours
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#34D399]/60" />
          Redemptions
        </span>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
              color: "#fff",
            }}
            formatter={(v) => [Number(v ?? 0), "Redemptions"]}
            labelFormatter={(l) => `${l}:00`}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          {deadRanges.map(([s, e]) => {
            const startIdx = chartData.findIndex((d) => d.hour === s);
            const endIdx = chartData.findIndex((d) => d.hour === e - 1);
            if (startIdx === -1) return null;
            const startLabel = chartData[startIdx]?.label;
            const endLabel = chartData[Math.min(endIdx, chartData.length - 1)]?.label;
            return (
              <ReferenceArea
                key={`${s}-${e}`}
                x1={startLabel}
                x2={endLabel}
                fill="rgba(255,255,255,0.04)"
                strokeOpacity={0}
              />
            );
          })}
          <Bar
            dataKey="count"
            fill="#34D399"
            fillOpacity={0.7}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ControlRoom({
  stats,
  merchantId,
  onPauseToggle,
}: {
  stats: MerchantDashboardStats;
  merchantId: string;
  onPauseToggle: (paused: boolean) => void;
}) {
  const [isPaused, setIsPaused] = useState(stats.is_paused);
  const [strategy, setStrategy] = useState<"autopilot" | "manual">(
    stats.strategy === "manual" ? "manual" : "autopilot"
  );
  const [maxDiscount, setMaxDiscount] = useState(stats.max_discount_percent);
  const [minSpend, setMinSpend] = useState(Math.round(stats.min_spend_usd));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const handlePause = async () => {
    setPauseLoading(true);
    try {
      const result = await patchMerchantCampaign(merchantId, !isPaused);
      setIsPaused(result.is_paused);
      onPauseToggle(result.is_paused);
    } finally {
      setPauseLoading(false);
    }
  };

  const handleSaveRules = async () => {
    setSaving(true);
    try {
      await patchMerchantRules(merchantId, {
        max_discount_percent: maxDiscount,
        min_spend_usd: minSpend,
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest px-1">
        Control Room
      </h2>

      {/* Panic Button */}
      <button
        onClick={handlePause}
        disabled={pauseLoading}
        className={`w-full rounded-2xl border p-5 flex items-center justify-between transition-all active:scale-[0.98] ${
          isPaused
            ? "bg-[#FBBF24]/10 border-[#FBBF24]/40"
            : "bg-[#EF4444]/10 border-[#EF4444]/30 hover:border-[#EF4444]/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
              isPaused ? "bg-[#FBBF24]/20" : "bg-[#EF4444]/20"
            }`}
          >
            {isPaused ? "⏸" : "⏹"}
          </div>
          <div className="text-left">
            <div
              className={`text-base font-bold ${
                isPaused ? "text-[#FBBF24]" : "text-[#EF4444]"
              }`}
            >
              {isPaused ? "Campaign Paused" : "Pause All Deals"}
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              {isPaused
                ? "Tap to resume — no new offers are going out"
                : "Instantly stop all active platform deals"}
            </div>
          </div>
        </div>
        <div
          className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${
            isPaused ? "bg-[#FBBF24]/30 justify-end" : "bg-[#EF4444]/30 justify-start"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full ${
              isPaused ? "bg-[#FBBF24]" : "bg-[#EF4444]"
            }`}
          />
        </div>
      </button>

      {/* Strategy Toggle */}
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Strategy Engine</p>
            <p className="text-xs text-white/40 mt-0.5">How deals are triggered</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["autopilot", "manual"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStrategy(s)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                strategy === s
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60 border border-white/10"
              }`}
            >
              {s === "autopilot" ? "Auto-Pilot" : "Manual Schedule"}
            </button>
          ))}
        </div>
        {strategy === "autopilot" && (
          <p className="text-xs text-white/40 leading-relaxed">
            AI detects your slow periods and activates deals automatically. No input needed.
          </p>
        )}
        {strategy === "manual" && (
          <p className="text-xs text-white/40 leading-relaxed">
            Deals go live on the schedule you set during onboarding. Edit in campaign settings.
          </p>
        )}
      </div>

      {/* Threshold Sliders */}
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 space-y-5">
        <p className="text-sm font-semibold text-white">Offer Thresholds</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/60">Max Allowed Discount</label>
            <span className="text-sm font-semibold text-white">{maxDiscount}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={40}
            step={5}
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#4F8CFF]"
          />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>5%</span><span>40%</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/60">Minimum Spend</label>
            <span className="text-sm font-semibold text-white">${minSpend}</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={minSpend}
            onChange={(e) => setMinSpend(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#4F8CFF]"
          />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>$5</span><span>$60</span>
          </div>
        </div>

        <button
          onClick={handleSaveRules}
          disabled={saving}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
            savedFlash
              ? "bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30"
              : "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
          }`}
        >
          {savedFlash ? "Saved" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Advanced Settings */}
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setShowAdvanced((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm text-white/60 hover:text-white/80 transition-colors"
        >
          <span className="font-medium">Advanced Settings</span>
          <span className="text-white/30 text-xs">{showAdvanced ? "▲" : "▼"}</span>
        </button>

        {showAdvanced && (
          <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
            {/* DSV Health */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 font-medium">DSV Integration</p>
                <p className="text-xs text-white/40">POS data sync status</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34D399]" />
                </span>
                <span className="text-xs text-[#34D399] font-medium">Connected</span>
              </div>
            </div>

            {/* Holiday Overrides */}
            <div className="space-y-2">
              <div>
                <p className="text-sm text-white/80 font-medium">Holiday Overrides</p>
                <p className="text-xs text-white/40">Block dates when no discounts should run</p>
              </div>
              <input
                type="date"
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-[#4F8CFF]/60"
              />
              <p className="text-[10px] text-white/30">
                e.g. Valentine&apos;s Day, Mother&apos;s Day, holidays with guaranteed foot traffic
              </p>
            </div>

            {/* Brand Assets */}
            <div className="space-y-2">
              <div>
                <p className="text-sm text-white/80 font-medium">Brand Assets</p>
                <p className="text-xs text-white/40">Update without re-running full setup</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/merchant?step=brand"
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-white/60 text-center hover:border-white/20 hover:text-white/80 transition-colors"
                >
                  Update Images
                </Link>
                <Link
                  href="/merchant?step=brand"
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-white/60 text-center hover:border-white/20 hover:text-white/80 transition-colors"
                >
                  Edit Tagline
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function DashboardContent() {
  const params = useSearchParams();
  const merchantId = params.get("id") ?? "m_001";
  const name = params.get("name") ?? "Your Business";
  const category = (params.get("category") ?? "restaurant") as MerchantCategory;

  const [stats, setStats] = useState<MerchantDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    getMerchantDashboard(merchantId)
      .then((data) => {
        setStats(data);
        setIsPaused(data.is_paused);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [merchantId]);

  const handlePauseToggle = useCallback((paused: boolean) => {
    setIsPaused(paused);
  }, []);

  const emoji = CATEGORY_EMOJI[category] ?? "🏪";

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0f0f0f] pb-16">
        <header className="px-4 py-4 border-b border-white/10">
          <span className="text-sm font-semibold text-white/80 tracking-wide">City Wallet</span>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white/30 text-sm">Loading dashboard...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0f0f0f] pb-16">
        <header className="px-4 py-4 border-b border-white/10">
          <span className="text-sm font-semibold text-white/80 tracking-wide">City Wallet</span>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <div>
            <p className="text-white/40 text-sm mb-4">{error ?? "Could not load dashboard"}</p>
            <Link href="/merchant" className="text-xs text-[#4F8CFF]">Back to setup</Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Delta vs first half of period (rough trend indicator)
  const midpoint = Math.floor(stats.daily_series.length / 2);
  const firstHalf = stats.daily_series.slice(0, midpoint);
  const secondHalf = stats.daily_series.slice(midpoint);
  const firstRevenue = firstHalf.reduce((s, d) => s + d.revenue_usd, 0);
  const secondRevenue = secondHalf.reduce((s, d) => s + d.revenue_usd, 0);
  const revDeltaPct =
    firstRevenue > 0 ? Math.round(((secondRevenue - firstRevenue) / firstRevenue) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-[#0f0f0f]">
      {/* Header */}
      <header className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-semibold text-white/80 tracking-wide">City Wallet</span>
        <div className="flex items-center gap-2">
          {isPaused ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FBBF24]" />
              </span>
              <span className="text-xs font-medium text-[#FBBF24]">Paused</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34D399]" />
              </span>
              <span className="text-xs font-medium text-[#34D399]">Live</span>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 px-4 py-6 space-y-6 animate-fade-in">
        {/* Business identity */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">{emoji}</div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{name}</h1>
            <p className="text-xs text-white/40 capitalize mt-0.5">{category} · Last 30 days</p>
          </div>
        </div>

        {/* Hero Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <HeroCard
            label="Incremental Revenue"
            value={`$${stats.incremental_revenue_usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            sub={
              revDeltaPct !== 0
                ? `${revDeltaPct > 0 ? "+" : ""}${revDeltaPct}% vs first half`
                : "from coupon-linked checks"
            }
            accent={revDeltaPct > 0}
          />
          <HeroCard
            label="Empty Seats Filled"
            value={`${stats.total_redemptions}`}
            sub="coupons validated"
          />
          <HeroCard
            label="Avg Ticket Size"
            value={`$${stats.avg_ticket_usd.toFixed(2)}`}
            sub={`vs $${Math.round(stats.min_spend_usd)} min spend`}
          />
          <HeroCard
            label="Avg Discount Given"
            value={`${stats.avg_discount_pct.toFixed(1)}%`}
            sub={`max allowed ${stats.max_discount_percent}%`}
          />
        </div>

        {/* Offer Funnel */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Offer Funnel</h2>
          <div className="space-y-2">
            {[
              { label: "Generated", value: stats.total_generated, pct: 100 },
              {
                label: "Accepted",
                value: stats.total_accepted,
                pct: stats.total_generated > 0 ? Math.round((stats.total_accepted / stats.total_generated) * 100) : 0,
              },
              {
                label: "Redeemed",
                value: stats.total_redemptions,
                pct: stats.total_generated > 0 ? Math.round((stats.total_redemptions / stats.total_generated) * 100) : 0,
              },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">{row.label}</span>
                  <span className="text-white font-medium">{row.value}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4F8CFF] transition-all"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 pt-1">
            <div className="text-xs text-white/40">
              Acceptance rate{" "}
              <span className="text-white font-medium">
                {(stats.acceptance_rate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-xs text-white/40">
              Redemption rate{" "}
              <span className="text-white font-medium">
                {(stats.redemption_rate * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <TrendChart stats={stats} />

        {/* Downtime Chart */}
        <DowntimeChart stats={stats} />

        {/* Top Triggers */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Top Activation Triggers</h2>
          <p className="text-xs text-white/40">Context signals that fired your deals most often</p>
          <div className="flex flex-wrap gap-2">
            {stats.top_context_triggers.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 text-xs text-[#4F8CFF] font-medium"
              >
                {tag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* Control Room */}
        <ControlRoom
          stats={stats}
          merchantId={merchantId}
          onPauseToggle={handlePauseToggle}
        />
      </div>

      <BottomNav />
    </div>
  );
}

export default function MerchantDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <DashboardContent />
    </Suspense>
  );
}
