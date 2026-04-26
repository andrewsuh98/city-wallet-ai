"use client";

import { useState } from "react";
import type { DemoMode } from "@/lib/demo";

interface DemoSwitcherProps {
  current: DemoMode | null;
  onChange: (mode: DemoMode | null) => void;
}

const SCENARIOS: { mode: DemoMode | null; label: string; icon: string; sub: string }[] = [
  { mode: null,              label: "Live",           icon: "ph-broadcast",     sub: "Real weather & time" },
  { mode: "rainy_afternoon", label: "Rainy afternoon",icon: "ph-cloud-rain",    sub: "11°C, Tuesday 2:30 pm" },
  { mode: "hot_weekend",     label: "Hot weekend",    icon: "ph-sun",           sub: "32°C, Saturday noon" },
  { mode: "event_night",     label: "Event night",    icon: "ph-ticket",        sub: "18°C, Friday 7 pm" },
];

export default function DemoSwitcher({ current, onChange }: DemoSwitcherProps) {
  const [open, setOpen] = useState(false);

  const active = SCENARIOS.find((s) => s.mode === current) ?? SCENARIOS[0];

  const select = (mode: DemoMode | null) => {
    onChange(mode);
    setOpen(false);
  };

  return (
    <div style={{ position: "fixed", bottom: "88px", right: "16px", zIndex: 50 }}>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: -1 }}
          />
          <div style={{
            position: "absolute",
            bottom: "52px",
            right: 0,
            width: "220px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--radius-3)",
            boxShadow: "var(--shadow-3)",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "10px 14px 8px",
              borderBottom: "1px solid var(--border-2)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "var(--ls-caps)",
              textTransform: "uppercase",
              color: "var(--fg-4)",
            }}>
              Simulate scenario
            </div>
            {SCENARIOS.map((s) => {
              const isActive = s.mode === current;
              return (
                <button
                  key={s.label}
                  onClick={() => select(s.mode)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "10px 14px",
                    background: isActive ? "var(--cw-warm-bg)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <i className={`ph ${s.icon}`} style={{ fontSize: "16px", color: isActive ? "var(--cw-warm)" : "var(--fg-3)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.2 }}>{s.label}</div>
                    <div style={{ fontSize: "11px", color: "var(--fg-4)", marginTop: "2px" }}>{s.sub}</div>
                  </div>
                  {isActive && (
                    <i className="ph ph-check" style={{ fontSize: "14px", color: "var(--cw-warm)", marginLeft: "auto", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        title="Switch scenario"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 12px",
          borderRadius: "var(--radius-pill)",
          background: current ? "var(--cw-dusk-bg)" : "var(--bg-card)",
          border: "1px solid var(--border-2)",
          boxShadow: "var(--shadow-2)",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 600,
          color: current ? "var(--cw-dusk)" : "var(--fg-2)",
          whiteSpace: "nowrap",
        }}
      >
        <i className={`ph ${active.icon}`} style={{ fontSize: "14px" }} />
        {active.label}
      </button>
    </div>
  );
}
