"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import OfferCard from "@/components/OfferCard";
import type { MerchantCategory, Offer, OfferStyle } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  businessName: string;
  address: string;
  operatingHours: string;
  phone: string;
  category: MerchantCategory;
  images: string[];
  tagline: string;
  strategy: "autopilot" | "manual" | null;
  maxDiscountPercent: number;
  minSpend: number;
  scheduleDays: string[];
  scheduleStart: string;
  scheduleEnd: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DSV_MOCK: Partial<OnboardingData> = {
  businessName: "The Corner Bistro",
  address: "47 W 20th St, New York, NY 10011",
  operatingHours: "Mon–Fri 7:00 AM – 10:00 PM, Sat–Sun 8:00 AM – 11:00 PM",
  phone: "+1 (212) 555-0147",
  category: "restaurant",
};

const CATEGORY_STYLES: Record<MerchantCategory, OfferStyle> = {
  cafe:      { background_gradient: ["#4A2C2A", "#D4A574"], emoji: "☕",  tone: "warm",          headline_style: "emotional" },
  restaurant:{ background_gradient: ["#1a3a2a", "#2d6a4f"], emoji: "🍽️", tone: "warm",          headline_style: "emotional" },
  retail:    { background_gradient: ["#1a1a3e", "#4a4080"], emoji: "🛍️", tone: "sophisticated", headline_style: "factual"   },
  bakery:    { background_gradient: ["#3d2310", "#c4a265"], emoji: "🥐",  tone: "warm",          headline_style: "emotional" },
  bar:       { background_gradient: ["#1a1a2e", "#16213e"], emoji: "🍺",  tone: "playful",       headline_style: "emotional" },
  bookstore: { background_gradient: ["#2D1B4E", "#1a1a3e"], emoji: "📚",  tone: "sophisticated", headline_style: "emotional" },
  grocery:   { background_gradient: ["#1a3a2a", "#2d5016"], emoji: "🛒",  tone: "sophisticated", headline_style: "factual"   },
  fitness:   { background_gradient: ["#1a1a3e", "#0d3b6e"], emoji: "💪",  tone: "urgent",        headline_style: "factual"   },
};

const CATEGORIES: MerchantCategory[] = [
  "cafe", "restaurant", "retail", "bakery", "bar", "bookstore", "grocery", "fitness",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_DATA: OnboardingData = {
  businessName: "",
  address: "",
  operatingHours: "",
  phone: "",
  category: "restaurant",
  images: [],
  tagline: "",
  strategy: null,
  maxDiscountPercent: 20,
  minSpend: 15,
  scheduleDays: [],
  scheduleStart: "14:00",
  scheduleEnd: "16:30",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MerchantPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [showDsvModal, setShowDsvModal] = useState(false);
  const [dsvLoading, setDsvLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleDsvLogin = () => {
    setDsvLoading(true);
    setTimeout(() => {
      update(DSV_MOCK);
      setDsvLoading(false);
      setShowDsvModal(false);
      setStep(2);
    }, 1500);
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    update({ images: [...data.images, ...urls].slice(0, 3) });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    update({ images: data.images.filter((_, i) => i !== idx) });
  };

  const toggleDay = (day: string) => {
    const next = data.scheduleDays.includes(day)
      ? data.scheduleDays.filter((d) => d !== day)
      : [...data.scheduleDays, day];
    update({ scheduleDays: next });
  };

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      router.push(
        `/merchant/dashboard?id=m_001&name=${encodeURIComponent(data.businessName)}&category=${data.category}`
      );
    }, 900);
  };

  const canProceed = (): boolean => {
    if (step === 2) return data.images.length > 0 && data.tagline.trim().length > 0;
    if (step === 3) {
      if (!data.strategy) return false;
      if (data.strategy === "manual") return data.scheduleDays.length > 0;
      return true;
    }
    return true;
  };

  // Fabricated offer for the review step preview
  const previewOffer: Offer = {
    id: "preview",
    merchant_id: "preview",
    merchant_name: data.businessName,
    merchant_category: data.category,
    headline: `Quiet afternoon? Drop in for ${data.maxDiscountPercent}% off.`,
    subtext: `${data.maxDiscountPercent}% off at ${data.businessName} — limited time`,
    description: data.tagline,
    discount_value: `${data.maxDiscountPercent}%`,
    discount_type: "percentage_discount",
    context_tags: ["quiet_period"],
    why_now: "Slow period detected — your deal is now live.",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
    style: CATEGORY_STYLES[data.category],
    status: "active",
    distance_meters: 120,
    redemption_token: null,
  };

  // ── Header ──────────────────────────────────────────────────────────────────

  const header = (
    <header
      className={`flex items-center justify-between px-4 py-4 ${
        step > 1 ? "border-b border-white/10" : ""
      }`}
    >
      {step > 1 ? (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="text-sm text-white/50 hover:text-white/80 transition-colors w-14"
        >
          ← Back
        </button>
      ) : (
        <span className="text-sm font-semibold text-white/80 tracking-wide">
          City Wallet
        </span>
      )}
      {step > 1 && (
        <span className="text-xs font-medium text-white/40">Step {step} of 4</span>
      )}
      <div className="w-14" />
    </header>
  );

  // ── Progress bar ─────────────────────────────────────────────────────────────

  const progressBar = step > 1 && (
    <div className="flex gap-1.5 px-4 py-3">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-all duration-400 ${
            s < step ? "bg-success" : s === step ? "bg-accent" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );

  // ── Step 1: DSV Connect ──────────────────────────────────────────────────────

  const step1 = (
    <div className="flex-1 flex flex-col px-4 py-8 animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white leading-tight mb-4">
          Grow your business<br />on autopilot.
        </h1>
        <p className="text-base text-white/50 leading-relaxed">
          Connect your DSV account and we import your business data automatically.
          No manual entry, no forms.
        </p>
      </div>

      <div className="space-y-4 mb-10">
        {[
          "Business name & address pulled from your DSV profile",
          "Operating hours synced automatically",
          "Transaction data used to detect your slow hours",
        ].map((text) => (
          <div key={text} className="flex items-start gap-3">
            <span className="text-accent mt-0.5 shrink-0 text-sm">→</span>
            <span className="text-sm text-white/60 leading-relaxed">{text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowDsvModal(true)}
        className="w-full rounded-full bg-accent py-4 text-sm font-semibold text-white hover:scale-[1.02] active:scale-[0.98] transition-transform"
      >
        Connect DSV Account
      </button>
      <p className="text-xs text-white/25 text-center mt-4">
        Secure OAuth 2.0 connection. We never store your credentials.
      </p>
    </div>
  );

  // ── Step 2: Brand Essentials ─────────────────────────────────────────────────

  const step2 = (
    <div className="flex-1 px-4 py-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Make your business shine.</h2>
        <p className="text-sm text-white/50">These details appear on your City Wallet offer page.</p>
      </div>

      {/* DSV data card */}
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/40 uppercase tracking-wide">
            Imported from DSV
          </span>
          <span className="rounded-full bg-accent/10 border border-accent/30 px-2.5 py-0.5 text-xs font-medium text-accent">
            DSV
          </span>
        </div>
        {[
          { label: "Business", value: data.businessName },
          { label: "Address",  value: data.address },
          { label: "Hours",    value: data.operatingHours },
          { label: "Phone",    value: data.phone },
        ].map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <span className="text-xs text-white/30 w-14 shrink-0 pt-0.5">{row.label}</span>
            <span className="text-sm text-white/80">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Category selector */}
      <div>
        <label className="block text-xs font-medium text-white/60 uppercase tracking-wide mb-3">
          Business type
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => update({ category: cat })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                data.category === cat
                  ? "bg-accent text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-xs font-medium text-white/60 uppercase tracking-wide mb-3">
          Hero images (1–3)
        </label>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {data.images.map((url, i) => (
            <div
              key={i}
              className="relative shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-white/10"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white/80 text-xs hover:bg-black/90 transition-colors"
              >
                ×
              </button>
            </div>
          ))}

          {data.images.length < 3 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-28 h-28 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1.5 hover:border-white/40 hover:bg-white/5 transition-colors"
            >
              <span className="text-2xl text-white/30">+</span>
              <span className="text-xs text-white/30">Add photo</span>
            </button>
          )}

          {Array.from({ length: Math.max(0, 2 - data.images.length) }).map((_, i) => (
            <div
              key={`ghost-${i}`}
              className="shrink-0 w-28 h-28 rounded-2xl border border-dashed border-white/10"
            />
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageAdd}
        />
        <p className="text-xs text-white/30 mt-2">Food, interior, or your logo. JPG or PNG.</p>
      </div>

      {/* Tagline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wide">
            Tagline
          </label>
          <span className="text-xs text-white/30">{data.tagline.length}/150</span>
        </div>
        <textarea
          value={data.tagline}
          onChange={(e) => update({ tagline: e.target.value })}
          maxLength={150}
          rows={3}
          placeholder="Artisan coffee and vegan pastries made with love"
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/60 resize-none transition-colors"
        />
        <p className="text-xs text-white/30 mt-1">1–2 sentences. This appears on your offer card.</p>
      </div>
    </div>
  );

  // ── Step 3: Strategy Engine ──────────────────────────────────────────────────

  const step3 = (
    <div className="flex-1 px-4 py-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Fill your empty seats.</h2>
        <p className="text-sm text-white/50">
          City Wallet only activates your deals during slow periods. Never during your rush.
        </p>
      </div>

      {/* Auto-Pilot card */}
      <div
        className={`rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 ${
          data.strategy === "autopilot"
            ? "border-accent bg-accent/5"
            : "border-white/10 bg-[#1a1a1a] hover:border-white/25"
        }`}
        onClick={() => update({ strategy: "autopilot" })}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">✨</span>
          <span className="text-base font-semibold text-white">Auto-Pilot</span>
          {data.strategy === "autopilot" && (
            <span className="ml-auto text-xs font-medium text-accent">Selected</span>
          )}
        </div>
        <p className="text-sm text-white/50">
          Let our algorithm detect your slow hours in real-time and activate deals automatically.
        </p>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            data.strategy === "autopilot" ? "max-h-64 opacity-100 mt-5" : "max-h-0 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-5 pt-4 border-t border-white/10">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-white/60 uppercase tracking-wide">
                  Max discount
                </label>
                <span className="text-sm font-semibold text-white">
                  Up to {data.maxDiscountPercent}% off
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                value={data.maxDiscountPercent}
                onChange={(e) => update({ maxDiscountPercent: Number(e.target.value) })}
                className="w-full cursor-pointer"
                style={{ accentColor: "#4f8cff" }}
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>5%</span>
                <span>30%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wide mb-2">
                Minimum spend
              </label>
              <div className="flex items-center bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden focus-within:border-accent/60 transition-colors">
                <span className="px-3 text-sm text-white/40 border-r border-white/10 py-3">$</span>
                <input
                  type="number"
                  min={0}
                  value={data.minSpend}
                  onChange={(e) => update({ minSpend: Number(e.target.value) })}
                  className="flex-1 bg-transparent px-3 py-3 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Schedule card */}
      <div
        className={`rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 ${
          data.strategy === "manual"
            ? "border-accent bg-accent/5"
            : "border-white/10 bg-[#1a1a1a] hover:border-white/25"
        }`}
        onClick={() => update({ strategy: "manual" })}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🗓️</span>
          <span className="text-base font-semibold text-white">Manual Schedule</span>
          {data.strategy === "manual" && (
            <span className="ml-auto text-xs font-medium text-accent">Selected</span>
          )}
        </div>
        <p className="text-sm text-white/50">
          I know my slow hours. I'll schedule my own discount windows.
        </p>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            data.strategy === "manual" ? "max-h-96 opacity-100 mt-5" : "max-h-0 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-5 pt-4 border-t border-white/10">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-white/60 uppercase tracking-wide">
                  Discount
                </label>
                <span className="text-sm font-semibold text-white">
                  {data.maxDiscountPercent}% off
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                value={data.maxDiscountPercent}
                onChange={(e) => update({ maxDiscountPercent: Number(e.target.value) })}
                className="w-full cursor-pointer"
                style={{ accentColor: "#4f8cff" }}
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>5%</span>
                <span>30%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wide mb-3">
                Active days
              </label>
              <div className="flex gap-2">
                {DAYS.map((day) => {
                  const active = data.scheduleDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`w-9 h-9 rounded-full text-xs font-semibold transition-colors ${
                        active
                          ? "bg-accent text-white"
                          : "bg-white/10 text-white/50 hover:bg-white/20"
                      }`}
                    >
                      {day.slice(0, 1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wide mb-2">
                Time window
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={data.scheduleStart}
                  onChange={(e) => update({ scheduleStart: e.target.value })}
                  style={{ colorScheme: "dark" }}
                  className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-accent/60 transition-colors"
                />
                <span className="text-white/30 text-sm shrink-0">to</span>
                <input
                  type="time"
                  value={data.scheduleEnd}
                  onChange={(e) => update({ scheduleEnd: e.target.value })}
                  style={{ colorScheme: "dark" }}
                  className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-accent/60 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 4: Review & Activate ────────────────────────────────────────────────

  const summaryRows =
    data.strategy === "autopilot"
      ? [
          { label: "Strategy",     value: "Auto-Pilot" },
          { label: "Max discount", value: `${data.maxDiscountPercent}% off` },
          { label: "Min spend",    value: `$${data.minSpend}` },
          { label: "Operating",    value: data.operatingHours },
        ]
      : [
          { label: "Strategy",     value: "Manual Schedule" },
          { label: "Discount",     value: `${data.maxDiscountPercent}% off` },
          { label: "Active days",  value: data.scheduleDays.join(", ") || "—" },
          { label: "Hours",        value: `${data.scheduleStart} – ${data.scheduleEnd}` },
        ];

  const step4 = (
    <div className="flex-1 px-4 py-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Your campaign preview.</h2>
        <p className="text-sm text-white/50">
          This is what City Wallet users will see when your deal goes live.
        </p>
      </div>

      <div className="pointer-events-none">
        <OfferCard offer={previewOffer} />
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/40 uppercase tracking-wide">
            Campaign settings
          </span>
          <button
            onClick={() => setStep(3)}
            className="text-xs text-accent hover:text-white transition-colors pointer-events-auto"
          >
            Edit
          </button>
        </div>
        {summaryRows.map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <span className="text-xs text-white/30 w-20 shrink-0 pt-0.5">{row.label}</span>
            <span className="text-sm text-white/70">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── DSV Modal ─────────────────────────────────────────────────────────────────

  const dsvModal = showDsvModal && (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => !dsvLoading && setShowDsvModal(false)}
    >
      <div
        className="bg-[#1a1a1a] rounded-t-3xl px-6 pt-6 pb-12 w-full max-w-lg animate-slide-up border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-8" />

        <p className="text-xs font-medium text-white/40 uppercase tracking-widest text-center mb-2">
          DSV Partner Login
        </p>
        <h3 className="text-xl font-bold text-white text-center mb-8">
          Connect your DSV account
        </h3>

        <div className="space-y-3 mb-6">
          <input
            type="email"
            defaultValue="merchant@example.com"
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/60 transition-colors"
            placeholder="Email"
          />
          <input
            type="password"
            defaultValue="password"
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/60 transition-colors"
            placeholder="Password"
          />
        </div>

        <button
          onClick={handleDsvLogin}
          disabled={dsvLoading}
          className="w-full rounded-full bg-white py-4 text-sm font-semibold text-black hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {dsvLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              Importing your data...
            </>
          ) : (
            "Sign in to DSV"
          )}
        </button>

        {!dsvLoading && (
          <button
            onClick={() => setShowDsvModal(false)}
            className="w-full mt-4 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  // ── Sticky CTA ────────────────────────────────────────────────────────────────

  const stickyCta = step > 1 && (
    <div className="sticky bottom-16 z-10 px-4 pb-4 pt-6 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/90 to-transparent">
      <button
        onClick={step === 4 ? handlePublish : () => setStep((s) => s + 1)}
        disabled={!canProceed() || publishing}
        className={`w-full rounded-full py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          !canProceed() || publishing
            ? "bg-white/10 text-white/30 cursor-not-allowed"
            : "bg-white text-black hover:scale-[1.02] active:scale-[0.98]"
        }`}
      >
        {step === 4 ? (
          publishing ? (
            <>
              <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish Campaign →"
          )
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-[#0f0f0f]">
      {header}
      {progressBar}

      <div className="flex-1 overflow-y-auto">
        {step === 1 && step1}
        {step === 2 && step2}
        {step === 3 && step3}
        {step === 4 && step4}
      </div>

      {stickyCta}
      {dsvModal}
      <BottomNav />
    </div>
  );
}
