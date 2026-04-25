"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import { getMerchantDashboard, patchMerchantCampaign, patchMerchantRules } from "@/lib/api";
import type { MerchantDashboardStats } from "@/lib/types";

// ─── Shared Styles ────────────────────────────────────────────────────────────

const screenStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minHeight: "100vh",
  padding: "60px 24px 120px",
  background: "var(--bg-page)",
  textAlign: "center",
};

const iconContainer: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "var(--radius-pill)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "32px",
};

const hero: React.CSSProperties = {
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

const subtitle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  lineHeight: "var(--lh-normal)",
  color: "var(--fg-2)",
  maxWidth: "280px",
  marginBottom: "40px",
};

const primaryBtn: React.CSSProperties = {
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

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  padding: "14px 16px",
  borderRadius: "var(--radius-2)",
  border: "1px solid var(--border-2)",
  background: "var(--bg-card)",
  color: "var(--fg-1)",
  width: "100%",
  outline: "none",
  textAlign: "left",
  transition: "border-color 120ms ease",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-micro)",
  fontWeight: 700,
  letterSpacing: "var(--ls-caps)",
  textTransform: "uppercase",
  color: "var(--fg-4)",
  marginBottom: "10px",
  textAlign: "left",
  width: "100%",
};

const strategyBtnStyle = (isSelected: boolean, fgAccent: string, bgAccent: string): React.CSSProperties => ({
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

function SettingsContent() {
  const params = useSearchParams();
  const merchantId = params.get("id") ?? "m_001";
  const [stats, setStats] = useState<MerchantDashboardStats | null>(null);
  
  // Settings States
  const [isPaused, setIsPaused] = useState(false);
  const [strategy, setStrategy] = useState<"autopilot" | "manual">("autopilot");
  const [maxDiscount, setMaxDiscount] = useState(20);
  const [minSpend, setMinSpend] = useState(15);
  const [maxOffersPerDay, setMaxOffersPerDay] = useState(10);
  
  // Offer Mechanics States (matches Onboarding)
  const [offerTypes, setOfferTypes] = useState<("discount" | "bogo" | "free_item")[]>(["discount"]);
  const [bogoDetails, setBogoDetails] = useState("Buy 1 get 1 free");
  const [freeItemDetails, setFreeItemDetails] = useState("Free cookie");
  const [freeItemCondition, setFreeItemCondition] = useState("with any coffee purchase");

  const toggleOfferType = (type: "discount" | "bogo" | "free_item") => {
    const isSelected = offerTypes.includes(type);
    if (isSelected) {
      setOfferTypes(offerTypes.filter(t => t !== type));
    } else {
      setOfferTypes([...offerTypes, type]);
    }
  };
  
  // Timing Schedule States (matches Onboarding)
  const [blockHolidays, setBlockHolidays] = useState(true);
  const [blockoutDates, setBlockoutDates] = useState<string[]>([]);
  const [manualSchedule, setManualSchedule] = useState<{ id: string; day: string; start: string; end: string }[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Helper functions for manual schedule
  const addTimeWindow = () => {
    setManualSchedule([...manualSchedule, { id: Math.random().toString(36).slice(2), day: "Mon", start: "14:00", end: "16:00" }]);
  };
  const removeTimeWindow = (id: string) => {
    setManualSchedule(manualSchedule.filter(s => s.id !== id));
  };
  const updateTimeWindow = (id: string, field: "day" | "start" | "end", value: string) => {
    setManualSchedule(manualSchedule.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addBlockout = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && !blockoutDates.includes(e.target.value)) {
      setBlockoutDates([...blockoutDates, e.target.value]);
    }
    e.target.value = "";
  };
  const removeBlockout = (date: string) => {
    setBlockoutDates(blockoutDates.filter(d => d !== date));
  };

  useEffect(() => {
    getMerchantDashboard(merchantId)
      .then((data) => {
        setStats(data);
        setIsPaused(data.is_paused);
        setStrategy(data.strategy as "autopilot" | "manual");
        setMaxDiscount(data.max_discount_percent);
        setMinSpend(Math.round(data.min_spend_usd));
        setMaxOffersPerDay(data.max_offers_per_day);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [merchantId]);

  const handlePause = async () => {
    try {
      const result = await patchMerchantCampaign(merchantId, !isPaused);
      setIsPaused(result.is_paused);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await patchMerchantRules(merchantId, {
        max_discount_percent: maxDiscount,
        min_spend_usd: minSpend,
        max_offers_per_day: maxOffersPerDay,
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !stats) return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="w-6 h-6 border-2 border-var(--fg-3) border-t-var(--fg-1) rounded-full animate-spin" />
      </div>
      <MerchantBottomNav />
    </div>
  );

  return (
    <div className="animate-fade-in" style={screenStyle}>
      <div style={{ ...iconContainer, background: "var(--cw-dusk-bg)" }}>
        <i className="ph ph-faders" style={{ fontSize: "28px", color: "var(--cw-dusk)" }} />
      </div>

      <h1 style={hero}>Control Room.</h1>
      <p style={subtitle}>Fine-tune your campaigns. Adjust thresholds or pause at any time.</p>

      {/* PAUSE TOGGLE */}
      <div style={{ width: "100%", maxWidth: "320px", marginBottom: "40px" }}>
        <button
          onClick={handlePause}
          style={strategyBtnStyle(isPaused, "var(--action-primary)", "var(--bg-card)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
               <i className={`ph ${isPaused ? "ph-play" : "ph-pause"}`} style={{ fontSize: "24px" }} />
               <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>
                 {isPaused ? "Campaign Paused" : "Pause All Deals"}
               </span>
            </div>
            <div style={{ width: "40px", height: "24px", borderRadius: "99px", background: isPaused ? "var(--action-primary)" : "var(--border-2)", display: "flex", alignItems: "center", padding: "2px", transition: "all 0.2s", justifyContent: isPaused ? "flex-end" : "flex-start" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--bg-page)" }} />
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--fg-2)", marginTop: "12px", lineHeight: 1.4 }}>
            {isPaused 
              ? "No new offers are being distributed. Tap to resume." 
              : "Instantly stop all active platform deals from going out."}
          </p>
        </button>
      </div>

      {/* STRATEGY ENGINE */}
      <div style={{ width: "100%", maxWidth: "320px", marginBottom: "32px" }}>
        <div style={labelStyle}>Strategy Engine</div>
        <div style={{ display: "flex", gap: "10px", width: "100%", marginBottom: "16px" }}>
          <button
            onClick={() => setStrategy("autopilot")}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "var(--radius-3)",
              border: strategy === "autopilot" ? "2px solid var(--cw-cool)" : "1px solid var(--border-2)",
              background: strategy === "autopilot" ? "var(--cw-cool-bg)" : "var(--bg-card)",
              color: strategy === "autopilot" ? "var(--cw-cool)" : "var(--fg-2)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-small)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Automatic
          </button>
          <button
            onClick={() => setStrategy("manual")}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "var(--radius-3)",
              border: strategy === "manual" ? "2px solid var(--cw-cool)" : "1px solid var(--border-2)",
              background: strategy === "manual" ? "var(--cw-cool-bg)" : "var(--bg-card)",
              color: strategy === "manual" ? "var(--cw-cool)" : "var(--fg-2)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-small)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Manual
          </button>
        </div>

        {/* Strategy-specific settings */}
        <div className="animate-fade-in" style={{ textAlign: "left", background: "var(--bg-card)", padding: "16px", borderRadius: "var(--radius-3)", border: "1px solid var(--border-2)" }}>
          {strategy === "autopilot" && (
            <p style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: 1.5, marginBottom: "16px" }}>
              We use external factors and your sales data to dynamically identify slow periods.
            </p>
          )}

          {strategy === "manual" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: 1.5 }}>
                You choose exactly when offers are active.
              </p>
              
              {manualSchedule.map((slot) => (
                 <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-page)", padding: "8px", borderRadius: "var(--radius-2)", border: "1px solid var(--border-2)" }}>
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

          {/* Shared Holidays/Blockout Settings */}
          <div style={{ borderTop: "1px solid var(--border-2)", paddingTop: "16px", marginTop: strategy === "manual" && manualSchedule.length === 0 ? "0" : "16px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginBottom: "16px" }}>
              <input type="checkbox" checked={blockHolidays} onChange={(e) => setBlockHolidays(e.target.checked)} style={{ marginTop: "4px", accentColor: "var(--cw-cool)" }} />
              <span style={{ fontSize: "13px", color: "var(--fg-2)", lineHeight: 1.4 }}>
                <strong>Block major holidays</strong> (Valentine's, Mother's Day, Christmas). You'll be notified 7 days prior.
              </span>
            </label>

            <div>
              <div style={labelStyle}>Add Blockout Dates</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {blockoutDates.map(date => (
                  <span key={date} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: "var(--cw-cool-bg)", color: "var(--cw-cool)", borderRadius: "var(--radius-1)", fontSize: "12px", fontWeight: 600 }}>
                    {date}
                    <i className="ph ph-x" style={{ cursor: "pointer" }} onClick={() => removeBlockout(date)} />
                  </span>
                ))}
              </div>
              <input type="date" onChange={addBlockout} style={{ ...inputStyle, textAlign: "left", padding: "8px" }} />
            </div>
          </div>
        </div>
      </div>

      {/* OFFER TYPES (Matches Onboarding) */}
      <div style={{ width: "100%", maxWidth: "320px", marginBottom: "40px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={labelStyle}>Offer Types</div>

        {/* Storewide Discount */}
        <button
          onClick={() => toggleOfferType("discount")}
          style={strategyBtnStyle(offerTypes.includes("discount"), "var(--cw-warm)", "var(--cw-warm-bg)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: offerTypes.includes("discount") ? "16px" : "0" }}>
             <i className="ph ph-percent" style={{ fontSize: "24px" }} />
             <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>Storewide Discount</span>
          </div>
          {offerTypes.includes("discount") && (
            <div className="animate-slide-up" style={{ textAlign: "left", borderTop: "1px solid var(--border-2)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
               <div>
                  <div style={labelStyle}>Discount: {maxDiscount}% off</div>
                  <input type="range" min={5} max={50} value={maxDiscount} onChange={e => setMaxDiscount(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--cw-warm)", cursor: "pointer" }} />
               </div>
               <div>
                  <div style={labelStyle}>Min Spend ($)</div>
                  <input type="number" min={0} value={minSpend} onChange={e => setMinSpend(Number(e.target.value))} style={{ ...inputStyle, textAlign: "left", padding: "10px" }} />
               </div>
            </div>
          )}
        </button>

        {/* BOGO */}
        <button
          onClick={() => toggleOfferType("bogo")}
          style={strategyBtnStyle(offerTypes.includes("bogo"), "var(--cw-warm)", "var(--cw-warm-bg)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: offerTypes.includes("bogo") ? "16px" : "0" }}>
             <i className="ph ph-copy" style={{ fontSize: "24px" }} />
             <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>Buy One, Get One</span>
          </div>
          {offerTypes.includes("bogo") && (
            <div className="animate-slide-up" style={{ textAlign: "left", borderTop: "1px solid var(--border-2)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
               <div>
                  <div style={labelStyle}>Offer details</div>
                  <input type="text" value={bogoDetails} onChange={e => setBogoDetails(e.target.value)} placeholder="e.g. Buy 1 coffee, get 1 free" style={{ ...inputStyle, textAlign: "left", padding: "10px" }} />
               </div>
            </div>
          )}
        </button>

        {/* Free Item */}
        <button
          onClick={() => toggleOfferType("free_item")}
          style={strategyBtnStyle(offerTypes.includes("free_item"), "var(--cw-warm)", "var(--cw-warm-bg)")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: offerTypes.includes("free_item") ? "16px" : "0" }}>
             <i className="ph ph-gift" style={{ fontSize: "24px" }} />
             <span style={{ fontSize: "var(--fs-body)", fontWeight: 600 }}>Free Item with Purchase</span>
          </div>
          {offerTypes.includes("free_item") && (
            <div className="animate-slide-up" style={{ textAlign: "left", borderTop: "1px solid var(--border-2)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }} onClick={e => e.stopPropagation()}>
               <div>
                  <div style={labelStyle}>Free item</div>
                  <input type="text" value={freeItemDetails} onChange={e => setFreeItemDetails(e.target.value)} placeholder="e.g. Free cookie" style={{ ...inputStyle, textAlign: "left", padding: "10px" }} />
               </div>
               <div>
                  <div style={labelStyle}>Condition</div>
                  <input type="text" value={freeItemCondition} onChange={e => setFreeItemCondition(e.target.value)} placeholder="e.g. with any coffee purchase" style={{ ...inputStyle, textAlign: "left", padding: "10px" }} />
               </div>
            </div>
          )}
        </button>
      </div>

      {/* LIMITS SECTION */}
      <div style={{ width: "100%", maxWidth: "320px", marginBottom: "40px", padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border-2)", borderRadius: "var(--radius-3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={labelStyle}>Max redeemed offers per day</div>
          <span style={{ fontSize: "var(--fs-body)", fontWeight: 700, color: "var(--fg-1)" }}>{maxOffersPerDay}</span>
        </div>
        <input 
          type="range" 
          min={1} 
          max={50} 
          value={maxOffersPerDay} 
          onChange={e => setMaxOffersPerDay(Number(e.target.value))} 
          style={{ width: "100%", accentColor: "var(--cw-warm)", cursor: "pointer" }} 
        />
        <div style={{ fontSize: "12px", color: "var(--fg-3)", marginTop: "8px", textAlign: "left" }}>
          Limit how many users can claim your offer daily.
        </div>
      </div>

      <button 
        onClick={handleSaveSettings} 
        disabled={saving} 
        style={{ 
          ...primaryBtn, 
          background: savedFlash ? "var(--cw-fresh)" : "var(--action-primary)",
          color: savedFlash ? "var(--bg-page)" : "var(--fg-on-red)",
          opacity: saving ? 0.6 : 1, 
          cursor: saving ? "default" : "pointer" 
        }}
      >
        {savedFlash ? "Saved!" : saving ? "Saving..." : "Save Changes"}
      </button>

      <MerchantBottomNav />
    </div>
  );
}

export default function MerchantSettingsPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg-page)", minHeight: "100vh" }} />}>
      <SettingsContent />
    </Suspense>
  );
}
