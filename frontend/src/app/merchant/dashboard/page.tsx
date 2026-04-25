"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import { getMerchantDashboard } from "@/lib/api";
import type { MerchantDashboardStats, MerchantCategory } from "@/lib/types";

const HOUR_LABEL = (h: number) => {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
};

function HeroCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border-2)", borderRadius: "var(--radius-3)" }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, letterSpacing: "var(--ls-caps)", textTransform: "uppercase", color: "var(--fg-4)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "32px", lineHeight: "1", fontWeight: 500, color: accent ? "var(--cw-fresh)" : "var(--fg-1)", letterSpacing: "-0.02em", margin: "4px 0" }}>{value}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--fg-3)", lineHeight: "1.3" }}>{sub}</span>
    </div>
  );
}

function WeekdayAnalysisChart({ stats }: { stats: MerchantDashboardStats }) {
  const weekdayTotals: Record<string, { total: number; count: number }> = {
    Mon: { total: 0, count: 0 },
    Tue: { total: 0, count: 0 },
    Wed: { total: 0, count: 0 },
    Thu: { total: 0, count: 0 },
    Fri: { total: 0, count: 0 },
    Sat: { total: 0, count: 0 },
    Sun: { total: 0, count: 0 },
  };

  stats.daily_series.forEach((d) => {
    const date = new Date(d.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    if (weekdayTotals[dayName]) {
      weekdayTotals[dayName].total += d.redemptions;
      weekdayTotals[dayName].count += 1;
    }
  });

  const chartData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
    day,
    avg: weekdayTotals[day].count > 0 ? (weekdayTotals[day].total / weekdayTotals[day].count).toFixed(1) : 0,
  }));

  const tooltipStyle = { background: "var(--bg-card)", border: "1px solid var(--border-2)", borderRadius: "var(--radius-2)", fontSize: 12, color: "var(--fg-1)", fontFamily: "var(--font-body)" };

  return (
    <div style={{ paddingTop: "32px", paddingBottom: "16px", borderBottom: "1px solid var(--border-2)", marginBottom: "16px" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 500, color: "var(--fg-1)", marginBottom: "8px", letterSpacing: "var(--ls-tight)" }}>Weekday Analysis</h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-body)", color: "var(--fg-2)", marginBottom: "32px", lineHeight: 1.4 }}>
        Average coupon redemptions per day of the week. This helps you identify which days consistently need the most platform support.
      </p>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barCategoryGap="25%">
          <CartesianGrid stroke="var(--border-2)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "var(--fg-3)", fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 500 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "var(--fg-3)", fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 500 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v ?? 0), "Avg Redemptions"]} cursor={{ fill: "var(--bg-card)" }} />
          <Bar dataKey="avg" fill="var(--cw-fresh)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HourlyActivationChart({ stats }: { stats: MerchantDashboardStats }) {
  const deadRanges = stats.dead_hour_ranges;
  const chartData = stats.hourly_redemptions.map((h) => ({ hour: h.hour, label: HOUR_LABEL(h.hour), count: h.count }));
  const tooltipStyle = { background: "var(--bg-card)", border: "1px solid var(--border-2)", borderRadius: "var(--radius-2)", fontSize: 12, color: "var(--fg-1)", fontFamily: "var(--font-body)" };

  return (
    <div style={{ paddingTop: "32px", paddingBottom: "16px" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 500, color: "var(--fg-1)", marginBottom: "8px", letterSpacing: "var(--ls-tight)" }}>Hourly Activations</h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-body)", color: "var(--fg-2)", marginBottom: "32px", lineHeight: 1.4 }}>
        Average redemptions by hour across the week. Notice how offers fire precisely during your target slow periods to boost foot traffic.
      </p>
      
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--fg-2)", fontWeight: 600 }}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--cw-fresh-bg)" }} />Target slow hours</span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--cw-fresh)" }} />Redemptions</span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid stroke="var(--border-2)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--fg-3)", fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 500 }} tickLine={false} axisLine={false} interval={2} />
          <YAxis tick={{ fill: "var(--fg-3)", fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 500 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v ?? 0), "Redemptions"]} labelFormatter={(l) => `${l}`} cursor={{ fill: "var(--bg-card)" }} />
          {deadRanges.map(([s, e]) => {
            const startIdx = chartData.findIndex((d) => d.hour === s);
            const endIdx = chartData.findIndex((d) => d.hour === e - 1);
            if (startIdx === -1) return null;
            return <ReferenceArea key={`${s}-${e}`} x1={chartData[startIdx]?.label} x2={chartData[Math.min(endIdx, chartData.length - 1)]?.label} fill="var(--cw-fresh-bg)" strokeOpacity={0} />;
          })}
          <Bar dataKey="count" fill="var(--cw-fresh)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DashboardContent() {
  const params = useSearchParams();
  const merchantId = params.get("id") ?? "m_001";
  const name = params.get("name") ?? "Your Business";
  const category = (params.get("category") ?? "restaurant") as MerchantCategory;
  const [stats, setStats] = useState<MerchantDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMerchantDashboard(merchantId)
      .then((data) => setStats(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [merchantId]);

  if (loading) return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "32px 24px", borderBottom: "1px solid var(--border-2)" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "var(--ls-caps)", textTransform: "uppercase", color: "var(--fg-3)" }}>City Wallet Partner</span>
      </header>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="w-6 h-6 border-2 border-var(--fg-3) border-t-var(--fg-1) rounded-full animate-spin" />
      </div>
      <MerchantBottomNav />
    </div>
  );

  if (!stats) return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "32px 24px", borderBottom: "1px solid var(--border-2)" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "var(--ls-caps)", textTransform: "uppercase", color: "var(--fg-3)" }}>City Wallet Partner</span>
      </header>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontSize: "14px" }}>
        Could not load dashboard
      </div>
      <MerchantBottomNav />
    </div>
  );

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh", paddingBottom: "100px" }}>
      <header style={{ padding: "32px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "var(--ls-caps)", textTransform: "uppercase", color: "var(--fg-4)" }}>Partner Dashboard</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {stats.is_paused ? (
            <><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: "var(--cw-warm)" }} /><span style={{ fontSize: "12px", fontWeight: 600, color: "var(--cw-warm)" }}>Paused</span></>
          ) : (
            <><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: "var(--cw-fresh)" }} /><span style={{ fontSize: "12px", fontWeight: 600, color: "var(--cw-fresh)" }}>Live</span></>
          )}
        </div>
      </header>

      <div className="animate-fade-in" style={{ padding: "0 24px" }}>
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "40px", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--fg-1)", marginBottom: "8px" }}>{name}</h1>
          <p style={{ fontSize: "14px", color: "var(--fg-2)", textTransform: "capitalize" }}>{category} · Weekly Pulse</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <HeroCard label="Revenue" value={`$${stats.incremental_revenue_usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} sub="Incremental driven" accent />
          </div>
          <HeroCard label="Seats Filled" value={`${stats.total_redemptions}`} sub="Coupons validated" />
          <HeroCard label="Avg Ticket" value={`$${stats.avg_ticket_usd.toFixed(2)}`} sub={`Vs $${Math.round(stats.min_spend_usd)} min spend`} />
        </div>

        <WeekdayAnalysisChart stats={stats} />
        <HourlyActivationChart stats={stats} />
      </div>

      <MerchantBottomNav />
    </div>
  );
}

export default function MerchantDashboard() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg-page)", minHeight: "100vh" }} />}>
      <DashboardContent />
    </Suspense>
  );
}
