"use client";

import { useState, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import OfferCard from "@/components/OfferCard";
import type { MerchantCategory, Offer, OfferStyle } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyHours {
  isOpen: boolean;
  start: string;
  end: string;
}

interface OnboardingData {
  businessName: string;
  address: string;
  operatingHours: Record<string, DailyHours>;
  phone: string;
  category: MerchantCategory;
  images: string[];
  description: string;
  
  timingMode: "automatic" | "manual" | null;
  blockHolidays: boolean;
  blockoutDates: string[];
  manualSchedule: { id: string; day: string; start: string; end: string }[];
  
  offerTypes: ("discount" | "bogo" | "free_item")[];
  maxDiscountPercent: number;
  minSpend: number;
  bogoDetails: string;
  freeItemDetails: string;
  freeItemCondition: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DSV_MOCK: Partial<OnboardingData> = {
  businessName: "The Corner Bistro",
  address: "47 W 20th St, New York, NY 10011",
  operatingHours: {
    Mon: { isOpen: true, start: "07:00", end: "22:00" },
    Tue: { isOpen: true, start: "07:00", end: "22:00" },
    Wed: { isOpen: true, start: "07:00", end: "22:00" },
    Thu: { isOpen: true, start: "07:00", end: "22:00" },
    Fri: { isOpen: true, start: "07:00", end: "22:00" },
    Sat: { isOpen: true, start: "08:00", end: "23:00" },
    Sun: { isOpen: true, start: "08:00", end: "23:00" },
  },
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

const CATEGORIES: { id: MerchantCategory; label: string; icon: string }[] = [
  { id: "cafe", label: "Cafe", icon: "ph-coffee" },
  { id: "restaurant", label: "Restaurant", icon: "ph-pizza" },
  { id: "bakery", label: "Bakery", icon: "ph-cookie" },
  { id: "bar", label: "Bar", icon: "ph-wine" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_DATA: OnboardingData = {
  businessName: "",
  address: "",
  operatingHours: DAYS.reduce((acc, day) => {
    acc[day] = { isOpen: true, start: "09:00", end: "17:00" };
    return acc;
  }, {} as Record<string, DailyHours>),
  phone: "",
  category: "restaurant",
  images: [],
  description: "",
  timingMode: null,
  blockHolidays: true,
  blockoutDates: [],
  manualSchedule: [],
  offerTypes: [],
  maxDiscountPercent: 20,
  minSpend: 15,
  bogoDetails: "Buy 1 get 1 free",
  freeItemDetails: "Free cookie",
  freeItemCondition: "with any coffee purchase",
};

// ─── Shared Styles ────────────────────────────────────────────────────────────

const screen: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: "40px 24px",
  background: "var(--bg-page)",
  textAlign: "center",
};

const iconContainer: CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "var(--radius-pill)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "32px",
};

const hero: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "36px",
  lineHeight: "1.08",
  letterSpacing: "var(--ls-tight)",
  fontWeight: 500,
  color: "var(--fg-1)",
  marginBottom: "16px",
  maxWidth: "300px",
  fontVariationSettings: '"opsz" 96, "SOFT" 50',
  textWrap: "balance",
};

const subtitle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  lineHeight: "var(--lh-normal)",
  color: "var(--fg-2)",
  maxWidth: "280px",
  marginBottom: "40px",
};

const primaryBtn: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  fontWeight: 600,
  padding: "14px 28px",
  borderRadius: "var(--radius-2)",
  background: "var(--action-primary)",
  color: "var(--fg-on-red)",
  border: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  width: "100%",
  maxWidth: "320px",
  justifyContent: "center",
  transition: "all 120ms ease",
};

const inputStyle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  padding: "14px 16px",
  borderRadius: "var(--radius-2)",
  border: "1px solid var(--border-2)",
  background: "var(--bg-card)",
  color: "var(--fg-1)",
  width: "100%",
  maxWidth: "320px",
  outline: "none",
  textAlign: "center",
  transition: "border-color 120ms ease",
};

const labelStyle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-micro)",
  fontWeight: 600,
  letterSpacing: "var(--ls-caps)",
  textTransform: "uppercase",
  color: "var(--fg-4)",
  marginBottom: "10px",
  textAlign: "left",
  width: "100%",
};

const tasteItem = (isSelected: boolean, fgAccent: string, bgAccent: string): CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  padding: "14px 4px",
  borderRadius: "var(--radius-3)",
  border: isSelected ? `2px solid ${fgAccent}` : "1px solid var(--border-2)",
  background: isSelected ? bgAccent : "var(--bg-card)",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-small)",
  fontWeight: 600,
  color: isSelected ? fgAccent : "var(--fg-2)",
  transition: "all 120ms ease",
});

const strategyBtnStyle = (isSelected: boolean, fgAccent: string, bgAccent: string): CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  padding: "16px",
  borderRadius: "var(--radius-3)",
  border: isSelected ? `2px solid ${fgAccent}` : "1px solid var(--border-2)",
  background: isSelected ? bgAccent : "var(--bg-card)",
  color: isSelected ? fgAccent : "var(--fg-1)",
  cursor: "pointer",
  transition: "all 120ms ease",
  width: "100%",
  textAlign: "left",
});

// ─── Screens ──────────────────────────────────────────────────────────────────

function DsvConnectScreen({ onNext }: { onNext: (data: Partial<OnboardingData>) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [dsvLoading, setDsvLoading] = useState(false);

  const handleDsvLogin = () => {
    setDsvLoading(true);
    setTimeout(() => {
      onNext(DSV_MOCK);
    }, 1500);
  };

  return (
    <>
      <div className="animate-fade-in" style={screen}>
        <div style={{ ...iconContainer, background: "var(--cw-warm-bg)" }}>
          <i className="ph ph-plugs-connected" style={{ fontSize: "28px", color: "var(--cw-warm)" }} />
        </div>

        <h1 style={hero}>Grow on autopilot.</h1>
        <p style={subtitle}>
          Connect your DSV account. We import your profile, hours, and detect slow periods automatically.
        </p>

        <button
          onClick={() => setShowModal(true)}
          style={primaryBtn}
        >
          Connect DSV Account
          <i className="ph ph-arrow-right" style={{ fontSize: "16px" }} />
        </button>

        <p style={{ marginTop: "20px", fontSize: "11px", color: "var(--fg-4)", letterSpacing: "var(--ls-caps)", textTransform: "uppercase", fontWeight: 600 }}>
          Secure OAuth 2.0
        </p>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => !dsvLoading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl px-6 pt-6 pb-12 w-full max-w-lg animate-slide-up border-t border-[rgba(21,19,15,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[rgba(21,19,15,0.12)] rounded-full mx-auto mb-8" />

            <p className="text-xs font-medium text-[#a89d87] uppercase tracking-widest text-center mb-2">
              DSV Partner Login
            </p>
            <h3 className="text-xl font-bold text-[#15130f] text-center mb-8">
              Connect your DSV account
            </h3>

            <div className="space-y-3 mb-6">
              <input
                type="email"
                defaultValue="merchant@example.com"
                className="w-full bg-[#faf7f2] border border-[rgba(21,19,15,0.10)] rounded-xl px-4 py-3 text-sm text-[#15130f] placeholder:text-[#a89d87] focus:outline-none focus:border-[#e30018]/50 transition-colors"
                placeholder="Email"
              />
              <input
                type="password"
                defaultValue="password"
                className="w-full bg-[#faf7f2] border border-[rgba(21,19,15,0.10)] rounded-xl px-4 py-3 text-sm text-[#15130f] placeholder:text-[#a89d87] focus:outline-none focus:border-[#e30018]/50 transition-colors"
                placeholder="Password"
              />
            </div>

            <button
              onClick={handleDsvLogin}
              disabled={dsvLoading}
              className="w-full rounded-full bg-[#e30018] py-4 text-sm font-semibold text-white hover:bg-[#c20014] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {dsvLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing your data...
                </>
              ) : (
                "Sign in to DSV"
              )}
            </button>

            {!dsvLoading && (
              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-4 text-sm text-[#a89d87] hover:text-[#7a715f] transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BrandScreen({ data, update, onNext }: { data: OnboardingData, update: (p: Partial<OnboardingData>) => void, onNext: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canProceed = data.description.trim().length > 0 && data.businessName.trim().length > 0; // images are optional

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

  return (
    <div className="animate-fade-in" style={{ ...screen, justifyContent: "flex-start", paddingTop: "80px" }}>
      <div style={{ ...iconContainer, background: "var(--cw-fresh-bg)" }}>
        <i className="ph ph-image" style={{ fontSize: "28px", color: "var(--cw-fresh)" }} />
      </div>

      <h1 style={hero}>Make it yours.</h1>
      <p style={subtitle}>Add your description and best photos. These appear when your offer goes live.</p>

      {/* Google Maps Import (Coming Soon) */}
      <div style={{ width: "100%", maxWidth: "320px", marginBottom: "32px" }}>
        <button 
          disabled 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            width: "100%", 
            padding: "16px", 
            borderRadius: "var(--radius-3)", 
            border: "1px dashed var(--border-2)", 
            background: "transparent", 
            opacity: 0.6,
            cursor: "not-allowed" 
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <i className="ph ph-map-pin" style={{ fontSize: "24px", color: "var(--fg-3)" }} />
            <span style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--fg-2)" }}>Import from Google Maps</span>
          </div>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "var(--ls-caps)", textTransform: "uppercase", background: "var(--border-2)", color: "var(--fg-3)", padding: "4px 8px", borderRadius: "var(--radius-pill)" }}>Coming Soon</span>
        </button>
      </div>

      {/* Images (Optional) at the top */}
      <div style={{ width: "100%", maxWidth: "320px", marginBottom: "28px" }}>
        <div style={labelStyle}>Hero images (Optional, up to 3)</div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {data.images.map((url, i) => (
            <div key={i} style={{ width: "80px", height: "80px", borderRadius: "var(--radius-3)", overflow: "hidden", position: "relative" }}>
               <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
               <button onClick={() => removeImage(i)} style={{ position: "absolute", top: "4px", right: "4px", width: "20px", height: "20px", borderRadius: "99px", background: "rgba(21,19,15,0.6)", color: "white", border: "none", fontSize: "10px", cursor: "pointer" }}>×</button>
            </div>
          ))}
          {data.images.length < 3 && (
            <button onClick={() => fileInputRef.current?.click()} style={{ width: "80px", height: "80px", borderRadius: "var(--radius-3)", border: "2px dashed var(--border-2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-4)" }}>
              <i className="ph ph-plus" style={{ fontSize: "24px" }} />
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
      </div>

      <div style={{ width: "100%", maxWidth: "320px", marginBottom: "28px" }}>
        <div style={labelStyle}>Business Name</div>
        <input
          type="text"
          value={data.businessName}
          onChange={(e) => update({ businessName: e.target.value })}
          placeholder="e.g. The Corner Bistro"
          style={{ ...inputStyle, textAlign: "left", marginBottom: "16px" }}
        />

        <div style={labelStyle}>Location</div>
        <input
          type="text"
          value={data.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="e.g. 47 W 20th St, New York"
          style={{ ...inputStyle, textAlign: "left", marginBottom: "16px" }}
        />

        <div style={labelStyle}>Opening Hours</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px", width: "100%" }}>
          {DAYS.map(day => (
            <div key={day} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", padding: "8px 12px", borderRadius: "var(--radius-2)", border: "1px solid var(--border-2)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", width: "70px" }}>
                <input 
                  type="checkbox" 
                  checked={data.operatingHours[day].isOpen}
                  onChange={(e) => update({ operatingHours: { ...data.operatingHours, [day]: { ...data.operatingHours[day], isOpen: e.target.checked } } })}
                  style={{ accentColor: "var(--cw-fresh)", width: "16px", height: "16px" }}
                />
                <span style={{ fontSize: "13px", fontWeight: 600, color: data.operatingHours[day].isOpen ? "var(--fg-1)" : "var(--fg-4)" }}>{day}</span>
              </label>
              
              {data.operatingHours[day].isOpen ? (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input 
                    type="time" 
                    value={data.operatingHours[day].start}
                    onChange={(e) => update({ operatingHours: { ...data.operatingHours, [day]: { ...data.operatingHours[day], start: e.target.value } } })}
                    style={{ ...inputStyle, padding: "4px", fontSize: "13px", width: "auto" }}
                  />
                  <span style={{ color: "var(--fg-4)", fontSize: "12px" }}>-</span>
                  <input 
                    type="time" 
                    value={data.operatingHours[day].end}
                    onChange={(e) => update({ operatingHours: { ...data.operatingHours, [day]: { ...data.operatingHours[day], end: e.target.value } } })}
                    style={{ ...inputStyle, padding: "4px", fontSize: "13px", width: "auto" }}
                  />
                </div>
              ) : (
                <span style={{ fontSize: "12px", color: "var(--fg-4)", fontStyle: "italic", paddingRight: "36px" }}>Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: "320px", marginBottom: "28px" }}>
        <div style={labelStyle}>Description</div>
        <textarea
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          maxLength={150}
          rows={3}
          placeholder="e.g. Artisan coffee and vegan pastries..."
          style={{ ...inputStyle, textAlign: "left", resize: "none" }}
        />
      </div>

      <div style={{ width: "100%", maxWidth: "320px", marginBottom: "40px" }}>
        <div style={labelStyle}>Business type</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%" }}>
          {CATEGORIES.map((cat) => {
            const isSelected = data.category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => update({ category: cat.id })}
                style={tasteItem(isSelected, "var(--cw-fresh)", "var(--cw-fresh-bg)")}
              >
                <i className={`ph ${cat.icon}`} style={{ fontSize: "24px" }} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onNext} disabled={!canProceed} style={{ ...primaryBtn, opacity: canProceed ? 1 : 0.4, cursor: canProceed ? "pointer" : "default" }}>
        Continue <i className="ph ph-arrow-right" style={{ fontSize: "16px" }} />
      </button>
    </div>
  );
}

function TimingScreen({ data, update, onNext }: { data: OnboardingData, update: (p: Partial<OnboardingData>) => void, onNext: () => void }) {
  const canProceed = data.timingMode === "automatic" || (data.timingMode === "manual" && data.manualSchedule.length > 0);

  const addTimeWindow = () => {
    update({
      manualSchedule: [
        ...data.manualSchedule,
        { id: Math.random().toString(36).slice(2), day: "Mon", start: "14:00", end: "16:00" }
      ]
    });
  };

  const removeTimeWindow = (id: string) => {
    update({ manualSchedule: data.manualSchedule.filter(s => s.id !== id) });
  };

  const updateTimeWindow = (id: string, field: "day" | "start" | "end", value: string) => {
    update({
      manualSchedule: data.manualSchedule.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const addBlockout = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && !data.blockoutDates.includes(e.target.value)) {
      update({ blockoutDates: [...data.blockoutDates, e.target.value] });
    }
    e.target.value = "";
  };

  const removeBlockout = (date: string) => {
    update({ blockoutDates: data.blockoutDates.filter(d => d !== date) });
  };

  return (
    <div className="animate-fade-in" style={{ ...screen, justifyContent: "flex-start", paddingTop: "80px" }}>
      <div style={{ ...iconContainer, background: "var(--cw-cool-bg)" }}>
        <i className="ph ph-clock" style={{ fontSize: "28px", color: "var(--cw-cool)" }} />
      </div>

      <h1 style={hero}>When to run offers?</h1>
      <p style={subtitle}>Identify slow periods to run coupons. You can always change this later.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px", marginBottom: "40px" }}>
        {/* Automatic Button */}
        <button
          onClick={() => update({ timingMode: "automatic" })}
          style={strategyBtnStyle(data.timingMode === "automatic", "var(--cw-cool)", "var(--cw-cool-bg)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: data.timingMode === "automatic" ? "16px" : "0" }}>
             <i className="ph ph-sparkle" style={{ fontSize: "24px" }} />
             <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>Automatic (Recommended)</span>
          </div>
          {data.timingMode === "automatic" && (
            <div className="animate-slide-up" style={{ textAlign: "left", borderTop: "1px solid var(--border-2)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
               <p style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: 1.5 }}>
                 We use external factors and your sales data to dynamically identify slow periods.
               </p>
               
               <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                 <input type="checkbox" checked={data.blockHolidays} onChange={(e) => update({ blockHolidays: e.target.checked })} style={{ marginTop: "4px", accentColor: "var(--cw-cool)" }} />
                 <span style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: 1.4 }}>
                   <strong>Block major holidays</strong> (Valentine's, Mother's Day, Christmas). You'll be notified 7 days prior.
                 </span>
               </label>

               <div>
                 <div style={labelStyle}>Add Blockout Dates</div>
                 <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                   {data.blockoutDates.map(date => (
                     <span key={date} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: "var(--cw-cool-bg)", color: "var(--cw-cool)", borderRadius: "var(--radius-1)", fontSize: "12px", fontWeight: 600 }}>
                       {date}
                       <i className="ph ph-x" style={{ cursor: "pointer" }} onClick={() => removeBlockout(date)} />
                     </span>
                   ))}
                 </div>
                 <input type="date" onChange={addBlockout} style={{ ...inputStyle, textAlign: "left", padding: "8px" }} />
               </div>
            </div>
          )}
        </button>

        {/* Manual Button */}
        <button
          onClick={() => update({ timingMode: "manual" })}
          style={strategyBtnStyle(data.timingMode === "manual", "var(--cw-cool)", "var(--cw-cool-bg)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: data.timingMode === "manual" ? "16px" : "0" }}>
             <i className="ph ph-calendar" style={{ fontSize: "24px" }} />
             <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>Manual Schedule</span>
          </div>
          {data.timingMode === "manual" && (
            <div className="animate-slide-up" style={{ textAlign: "left", borderTop: "1px solid var(--border-2)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
               <p style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: 1.5 }}>
                 You choose exactly when offers are active.
               </p>

               <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginTop: "8px" }}>
                 <input type="checkbox" checked={data.blockHolidays} onChange={(e) => update({ blockHolidays: e.target.checked })} style={{ marginTop: "4px", accentColor: "var(--cw-cool)" }} />
                 <span style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: 1.4 }}>
                   <strong>Block major holidays</strong> (Valentine's, Mother's Day, Christmas). You'll be notified 7 days prior.
                 </span>
               </label>
               
               {data.manualSchedule.map((slot, index) => (
                 <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px", borderRadius: "var(--radius-2)", border: "1px solid var(--border-2)" }}>
                   <select value={slot.day} onChange={e => updateTimeWindow(slot.id, "day", e.target.value)} style={{ background: "transparent", border: "none", fontSize: "13px", fontWeight: 600, color: "var(--fg-1)", outline: "none" }}>
                     {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                   <input type="time" value={slot.start} onChange={e => updateTimeWindow(slot.id, "start", e.target.value)} style={{ background: "transparent", border: "none", fontSize: "13px", color: "var(--fg-1)", outline: "none" }} />
                   <span style={{ color: "var(--fg-4)" }}>-</span>
                   <input type="time" value={slot.end} onChange={e => updateTimeWindow(slot.id, "end", e.target.value)} style={{ background: "transparent", border: "none", fontSize: "13px", color: "var(--fg-1)", outline: "none" }} />
                   <i className="ph ph-trash" style={{ marginLeft: "auto", color: "var(--fg-4)", cursor: "pointer" }} onClick={() => removeTimeWindow(slot.id)} />
                 </div>
               ))}
               
               <button onClick={addTimeWindow} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", padding: "10px", borderRadius: "var(--radius-2)", border: "1px dashed var(--border-2)", background: "transparent", color: "var(--cw-cool)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                 <i className="ph ph-plus" /> Add Time Window
               </button>
            </div>
          )}
        </button>
      </div>

      <button onClick={onNext} disabled={!canProceed} style={{ ...primaryBtn, opacity: canProceed ? 1 : 0.4, cursor: canProceed ? "pointer" : "default" }}>
        Continue <i className="ph ph-arrow-right" style={{ fontSize: "16px" }} />
      </button>
    </div>
  );
}

function OfferScreen({ data, update, onNext }: { data: OnboardingData, update: (p: Partial<OnboardingData>) => void, onNext: () => void }) {
  const canProceed = data.offerTypes.length > 0;

  const toggleOfferType = (type: "discount" | "bogo" | "free_item") => {
    const isSelected = data.offerTypes.includes(type);
    if (isSelected) {
      update({ offerTypes: data.offerTypes.filter(t => t !== type) });
    } else {
      update({ offerTypes: [...data.offerTypes, type] });
    }
  };

  return (
    <div className="animate-fade-in" style={{ ...screen, justifyContent: "flex-start", paddingTop: "80px" }}>
      <div style={{ ...iconContainer, background: "var(--cw-warm-bg)" }}>
        <i className="ph ph-tag" style={{ fontSize: "28px", color: "var(--cw-warm)" }} />
      </div>

      <h1 style={hero}>What's the offer?</h1>
      <p style={subtitle}>Choose the promotion types that best fit your margins. You can run multiple.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px", marginBottom: "40px" }}>
        {/* Storewide Discount */}
        <button
          onClick={() => toggleOfferType("discount")}
          style={strategyBtnStyle(data.offerTypes.includes("discount"), "var(--cw-warm)", "var(--cw-warm-bg)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: data.offerTypes.includes("discount") ? "16px" : "0" }}>
             <i className="ph ph-percent" style={{ fontSize: "24px" }} />
             <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>Storewide Discount</span>
          </div>
          {data.offerTypes.includes("discount") && (
            <div className="animate-slide-up" style={{ textAlign: "left", borderTop: "1px solid var(--border-2)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
               <div>
                  <div style={labelStyle}>Discount: {data.maxDiscountPercent}% off</div>
                  <input type="range" min={5} max={50} value={data.maxDiscountPercent} onChange={e => update({ maxDiscountPercent: Number(e.target.value) })} style={{ width: "100%", accentColor: "var(--cw-warm)", cursor: "pointer" }} />
               </div>
               <div>
                  <div style={labelStyle}>Min Spend ($)</div>
                  <input type="number" min={0} value={data.minSpend} onChange={e => update({ minSpend: Number(e.target.value) })} style={{ ...inputStyle, textAlign: "left", padding: "10px" }} />
               </div>
            </div>
          )}
        </button>

        {/* BOGO */}
        <button
          onClick={() => toggleOfferType("bogo")}
          style={strategyBtnStyle(data.offerTypes.includes("bogo"), "var(--cw-warm)", "var(--cw-warm-bg)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: data.offerTypes.includes("bogo") ? "16px" : "0" }}>
             <i className="ph ph-copy" style={{ fontSize: "24px" }} />
             <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>Buy One, Get One</span>
          </div>
          {data.offerTypes.includes("bogo") && (
            <div className="animate-slide-up" style={{ textAlign: "left", borderTop: "1px solid var(--border-2)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
               <div>
                  <div style={labelStyle}>Offer details</div>
                  <input type="text" value={data.bogoDetails} onChange={e => update({ bogoDetails: e.target.value })} placeholder="e.g. Buy 1 coffee, get 1 free" style={{ ...inputStyle, textAlign: "left", padding: "10px" }} />
               </div>
            </div>
          )}
        </button>

        {/* Free Item */}
        <button
          onClick={() => toggleOfferType("free_item")}
          style={strategyBtnStyle(data.offerTypes.includes("free_item"), "var(--cw-warm)", "var(--cw-warm-bg)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: data.offerTypes.includes("free_item") ? "16px" : "0" }}>
             <i className="ph ph-gift" style={{ fontSize: "24px" }} />
             <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>Free Item with Purchase</span>
          </div>
          {data.offerTypes.includes("free_item") && (
            <div className="animate-slide-up" style={{ textAlign: "left", borderTop: "1px solid var(--border-2)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
               <div>
                  <div style={labelStyle}>Free item</div>
                  <input type="text" value={data.freeItemDetails} onChange={e => update({ freeItemDetails: e.target.value })} placeholder="e.g. Free cookie" style={{ ...inputStyle, textAlign: "left", padding: "10px" }} />
               </div>
               <div>
                  <div style={labelStyle}>Condition</div>
                  <input type="text" value={data.freeItemCondition} onChange={e => update({ freeItemCondition: e.target.value })} placeholder="e.g. with any coffee purchase" style={{ ...inputStyle, textAlign: "left", padding: "10px" }} />
               </div>
            </div>
          )}
        </button>
      </div>

      <button onClick={onNext} disabled={!canProceed} style={{ ...primaryBtn, opacity: canProceed ? 1 : 0.4, cursor: canProceed ? "pointer" : "default" }}>
        Continue <i className="ph ph-arrow-right" style={{ fontSize: "16px" }} />
      </button>
    </div>
  );
}

function ReviewScreen({ data, onPublish, publishing }: { data: OnboardingData, onPublish: () => void, publishing: boolean }) {
  
  const previewOffers = data.offerTypes.map((type) => {
    let headline = "";
    let subtext = "";
    let discountValue = "";

    if (type === "discount") {
      headline = `Quiet afternoon? Drop in for ${data.maxDiscountPercent}% off.`;
      subtext = `${data.maxDiscountPercent}% off at ${data.businessName} — limited time`;
      discountValue = `${data.maxDiscountPercent}%`;
    } else if (type === "bogo") {
      headline = `Quiet afternoon? Drop in for ${data.bogoDetails}.`;
      subtext = `${data.bogoDetails} at ${data.businessName} — limited time`;
      discountValue = "BOGO";
    } else {
      headline = `Quiet afternoon? Drop in for a ${data.freeItemDetails} ${data.freeItemCondition}.`;
      subtext = `${data.freeItemDetails} at ${data.businessName} — limited time`;
      discountValue = "FREE";
    }

    return {
      id: `preview-${type}`,
      merchant_id: "preview",
      merchant_name: data.businessName,
      merchant_category: data.category,
      headline,
      subtext,
      description: data.description || "Artisan coffee and pastries.",
      discount_value: discountValue,
      discount_type: "percentage_discount",
      context_tags: ["quiet_period"],
      why_now: "Slow period detected — your deal is now live.",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      style: CATEGORY_STYLES[data.category],
      status: "active",
      distance_meters: 120,
      redemption_token: null,
    } as Offer;
  });

  return (
    <div className="animate-fade-in" style={{ ...screen, justifyContent: "flex-start", paddingTop: "80px" }}>
      <div style={{ ...iconContainer, background: "var(--cw-dusk-bg)" }}>
        <i className="ph ph-check-circle" style={{ fontSize: "28px", color: "var(--cw-dusk)" }} />
      </div>

      <h1 style={hero}>Ready to launch.</h1>
      <p style={subtitle}>Your campaign is configured. Here are the templates users might see.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "340px", marginBottom: "40px", pointerEvents: "none", textAlign: "left" }}>
        {previewOffers.map(offer => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      <button onClick={onPublish} disabled={publishing} style={{ ...primaryBtn, opacity: publishing ? 0.6 : 1, cursor: publishing ? "default" : "pointer" }}>
        {publishing ? "Publishing..." : "Publish Campaign"}
        {!publishing && <i className="ph ph-arrow-right" style={{ fontSize: "16px" }} />}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MerchantPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [publishing, setPublishing] = useState(false);

  const update = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      router.push(
        `/merchant/dashboard?id=m_001&name=${encodeURIComponent(data.businessName)}&category=${data.category}`
      );
    }, 900);
  };

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh" }}>
      {step > 1 && step < 5 && (
        <button
          onClick={() => setStep(s => s - 1)}
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-body)",
            fontWeight: 600,
            color: "var(--fg-2)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            zIndex: 10
          }}
        >
          <i className="ph ph-arrow-left" style={{ fontSize: "16px" }} />
          Back
        </button>
      )}

      {step === 1 && <DsvConnectScreen onNext={(dsv) => { update(dsv); setStep(2); }} />}
      {step === 2 && <BrandScreen data={data} update={update} onNext={() => setStep(3)} />}
      {step === 3 && <TimingScreen data={data} update={update} onNext={() => setStep(4)} />}
      {step === 4 && <OfferScreen data={data} update={update} onNext={() => setStep(5)} />}
      {step === 5 && <ReviewScreen data={data} onPublish={handlePublish} publishing={publishing} />}
    </div>
  );
}
