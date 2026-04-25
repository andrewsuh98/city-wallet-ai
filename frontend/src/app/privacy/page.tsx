"use client";

import type { CSSProperties } from "react";
import { clearConsent, getConsent } from "@/components/ConsentModal";
import { useRouter } from "next/navigation";

const page: CSSProperties = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "40px 20px 96px",
  background: "var(--bg-page)",
  minHeight: "100vh",
};

const heading: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h1)",
  lineHeight: "var(--lh-snug)",
  letterSpacing: "var(--ls-tight)",
  fontWeight: 500,
  color: "var(--fg-1)",
  marginBottom: "8px",
  fontVariationSettings: '"opsz" 60, "SOFT" 30',
};

const body: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  lineHeight: "var(--lh-normal)",
  color: "var(--fg-2)",
  marginBottom: "32px",
};

const sectionTitle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-h3)",
  fontWeight: 600,
  lineHeight: "var(--lh-snug)",
  letterSpacing: "var(--ls-snug)",
  color: "var(--fg-1)",
  marginBottom: "12px",
  marginTop: "32px",
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-small)",
  marginBottom: "24px",
};

const th: CSSProperties = {
  textAlign: "left",
  padding: "8px 8px 8px 0",
  fontWeight: 600,
  color: "var(--fg-1)",
  borderBottom: "1px solid var(--border-2)",
  fontSize: "var(--fs-micro)",
  letterSpacing: "var(--ls-caps)",
  textTransform: "uppercase",
};

const td: CSSProperties = {
  padding: "10px 8px 10px 0",
  borderBottom: "1px solid var(--border-1)",
  color: "var(--fg-2)",
  verticalAlign: "top",
};

const diagram: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  lineHeight: "1.5",
  color: "var(--fg-2)",
  background: "var(--cw-paper-100)",
  borderRadius: "var(--radius-3)",
  padding: "16px",
  overflowX: "auto",
  whiteSpace: "pre",
  marginBottom: "24px",
};

const card: CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: "var(--radius-3)",
  border: "1px solid var(--border-1)",
  padding: "16px",
  marginBottom: "16px",
};

const cardRow: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "12px",
};

const cardIcon: CSSProperties = {
  fontSize: "20px",
  color: "var(--fg-3)",
  flexShrink: 0,
  marginTop: "1px",
};

const dangerBtn: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  fontWeight: 600,
  padding: "12px 24px",
  borderRadius: "var(--radius-2)",
  background: "transparent",
  color: "var(--status-danger)",
  border: "1px solid var(--status-danger)",
  cursor: "pointer",
  width: "100%",
};

export default function PrivacyPage() {
  const router = useRouter();
  const isOnboarded = getConsent() !== null;

  const handleClearData = () => {
    clearConsent();
    router.push("/");
  };

  return (
    <div style={page}>
      <button
        onClick={() => router.back()}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-small)",
          color: "var(--fg-link)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "24px",
        }}
      >
        <i className="ph ph-arrow-left" style={{ fontSize: "14px" }} />
        Back
      </button>

      <h1 style={heading}>How your data is handled</h1>
      <p style={body}>
        City Wallet is designed around a simple principle: your data stays on your phone. Here is exactly what happens when you use the app.
      </p>

      {/* Architecture */}
      <h2 style={sectionTitle}>How it works</h2>

      <div style={card}>
        <div style={cardRow}>
          <i className="ph ph-device-mobile" style={cardIcon} />
          <div>
            <div style={{ fontWeight: 600, color: "var(--fg-1)", fontSize: "var(--fs-body)", marginBottom: "4px" }}>
              On your device
            </div>
            <div style={{ color: "var(--fg-2)", fontSize: "var(--fs-small)", lineHeight: "var(--lh-normal)" }}>
              GPS coordinates, movement patterns, and preferences are processed locally. Raw data never leaves the phone.
            </div>
          </div>
        </div>
        <div style={cardRow}>
          <i className="ph ph-arrow-down" style={{ ...cardIcon, color: "var(--fg-4)" }} />
          <div style={{ fontSize: "var(--fs-small)", color: "var(--fg-3)" }}>
            Only abstract intent signals cross the network
          </div>
        </div>
        <div style={{ ...cardRow, marginBottom: 0 }}>
          <i className="ph ph-cloud" style={cardIcon} />
          <div>
            <div style={{ fontWeight: 600, color: "var(--fg-1)", fontSize: "var(--fs-body)", marginBottom: "4px" }}>
              Server
            </div>
            <div style={{ color: "var(--fg-2)", fontSize: "var(--fs-small)", lineHeight: "var(--lh-normal)" }}>
              Receives intent tags and a single coordinate. Combines with public context (weather, time, events) to generate offers. No movement history, no browsing data, no personal info.
            </div>
          </div>
        </div>
      </div>

      {/* Data table */}
      <h2 style={sectionTitle}>What we collect</h2>

      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Data</th>
            <th style={th}>Stored</th>
            <th style={th}>Retention</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={td}>GPS coordinate</td>
            <td style={td}>No</td>
            <td style={td}>Discarded after request</td>
          </tr>
          <tr>
            <td style={td}>Session ID (random UUID)</td>
            <td style={td}>24h</td>
            <td style={td}>Then purged</td>
          </tr>
          <tr>
            <td style={td}>Offer interactions</td>
            <td style={td}>Aggregated</td>
            <td style={td}>Not linked to you after 24h</td>
          </tr>
          <tr>
            <td style={td}>Intent signals</td>
            <td style={td}>No</td>
            <td style={td}>Current request only</td>
          </tr>
        </tbody>
      </table>

      {/* What we don't collect */}
      <h2 style={sectionTitle}>What we do not collect</h2>

      <div style={{ ...body, marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            "Name, email, phone, or any personal information",
            "Movement history or GPS traces",
            "Browsing history or app usage",
            "Device identifiers or IP addresses",
            "Cookies or cross-session tracking",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="ph ph-x" style={{ fontSize: "14px", color: "var(--fg-4)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--fs-small)", color: "var(--fg-2)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* GDPR */}
      <h2 style={sectionTitle}>GDPR compliance</h2>

      <div style={card}>
        {[
          { article: "Art. 5", label: "Data minimization", desc: "Only the minimum data needed for offer generation." },
          { article: "Art. 6", label: "Lawful basis", desc: "Explicit consent via the location prompt. Works without it." },
          { article: "Art. 7", label: "Consent", desc: "Freely given, specific, informed, and revocable." },
          { article: "Art. 17", label: "Right to erasure", desc: "Clear your data below. Server purges after 24h." },
          { article: "Art. 25", label: "Privacy by design", desc: "On-device processing. No PII touches the server." },
        ].map((item, i, arr) => (
          <div key={item.article} style={{ ...cardRow, marginBottom: i === arr.length - 1 ? 0 : "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-micro)",
                fontWeight: 500,
                color: "var(--fg-3)",
                flexShrink: 0,
                width: "48px",
              }}
            >
              {item.article}
            </span>
            <div>
              <div style={{ fontWeight: 600, color: "var(--fg-1)", fontSize: "var(--fs-small)", marginBottom: "2px" }}>
                {item.label}
              </div>
              <div style={{ color: "var(--fg-2)", fontSize: "var(--fs-small)", lineHeight: "var(--lh-normal)" }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isOnboarded && (
        <>
          <h2 style={sectionTitle}>Clear my data</h2>
          <p style={{ ...body, marginBottom: "16px" }}>
            This removes your consent, preferences, and all locally stored data. The app will show the welcome screen again.
          </p>

          <button onClick={handleClearData} style={dangerBtn}>
            Clear all data and revoke consent
          </button>
        </>
      )}
    </div>
  );
}
