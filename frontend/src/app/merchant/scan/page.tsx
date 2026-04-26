"use client";

import { Suspense, useCallback, useState } from "react";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import QRScanner from "@/components/QRScanner";
import { validateToken, redeemOffer } from "@/lib/api";
import type { Offer } from "@/lib/types";

type ScanState =
  | { phase: "idle" }
  | { phase: "manual" }
  | { phase: "validating" }
  | { phase: "success"; offer: Offer; cashback: number }
  | { phase: "error"; message: string };

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
};

const subtitle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  lineHeight: "var(--lh-normal)",
  color: "var(--fg-2)",
  maxWidth: "280px",
  marginBottom: "40px",
};

async function processToken(token: string): Promise<{ offer: Offer; cashback: number }> {
  const validation = await validateToken(token);
  if (!validation.valid || !validation.offer) {
    throw new Error("Invalid or expired token");
  }
  const result = await redeemOffer(validation.offer.id, token);
  if (!result.success) {
    throw new Error(result.message || "Redemption failed");
  }
  return { offer: result.offer!, cashback: result.cashback_amount ?? 0 };
}

function ScanContent() {
  const [state, setState] = useState<ScanState>({ phase: "idle" });
  const [token, setToken] = useState("");

  const handleToken = useCallback(async (raw: string) => {
    setState({ phase: "validating" });
    try {
      const { offer, cashback } = await processToken(raw.trim());
      setState({ phase: "success", offer, cashback });
    } catch (e) {
      setState({ phase: "error", message: (e as Error).message });
    }
  }, []);

  const reset = () => {
    setState({ phase: "idle" });
    setToken("");
  };

  const iconBg =
    state.phase === "success" ? "var(--cw-fresh-bg)"
    : state.phase === "error" ? "var(--cw-red-50, #fff0f0)"
    : "var(--cw-warm-bg)";

  const iconColor =
    state.phase === "success" ? "var(--cw-fresh)"
    : state.phase === "error" ? "var(--action-primary)"
    : "var(--cw-warm)";

  const iconName =
    state.phase === "success" ? "ph-check-circle"
    : state.phase === "error" ? "ph-x-circle"
    : "ph-qr-code";

  return (
    <div className="animate-fade-in" style={screenStyle}>
      <div style={{ ...iconContainer, background: iconBg }}>
        <i className={`ph ${iconName}`} style={{ fontSize: "28px", color: iconColor }} />
      </div>

      {state.phase === "success" ? (
        <>
          <h1 style={hero}>Redeemed!</h1>
          <p style={subtitle}>
            {state.offer.merchant_name} &mdash; {state.offer.headline}
          </p>
          <div style={{
            padding: "24px 32px",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-3)",
            border: "1px solid var(--border-2)",
            marginBottom: "32px",
            minWidth: "200px",
          }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "var(--ls-caps)", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: "8px" }}>
              Cashback applied
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "48px", fontWeight: 500, color: "var(--cw-fresh)", lineHeight: 1, letterSpacing: "-0.02em" }}>
              +${state.cashback.toFixed(2)}
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              padding: "16px 32px",
              borderRadius: "var(--radius-pill)",
              background: "var(--bg-card)",
              color: "var(--fg-1)",
              border: "1px solid var(--border-2)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "var(--shadow-2)",
            }}
          >
            Scan another
          </button>
        </>
      ) : state.phase === "error" ? (
        <>
          <h1 style={hero}>Invalid token</h1>
          <p style={{ ...subtitle, color: "var(--action-primary)" }}>{state.message}</p>
          <button
            onClick={reset}
            style={{
              padding: "16px 32px",
              borderRadius: "var(--radius-pill)",
              background: "var(--bg-card)",
              color: "var(--fg-1)",
              border: "1px solid var(--border-2)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "var(--shadow-2)",
            }}
          >
            Try again
          </button>
        </>
      ) : state.phase === "validating" ? (
        <>
          <h1 style={hero}>Validating&hellip;</h1>
          <p style={subtitle}>Checking token with server.</p>
          <div className="w-10 h-10 border-4 border-border-2 border-t-cw-fresh rounded-full animate-spin" />
        </>
      ) : state.phase === "manual" ? (
        <>
          <h1 style={hero}>Paste token</h1>
          <p style={subtitle}>Paste the redemption token shown under the customer&apos;s QR code.</p>
          <div style={{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token here"
              rows={2}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "13px",
                fontFamily: "monospace",
                borderRadius: "var(--radius-3)",
                border: "1px solid var(--border-2)",
                background: "var(--bg-card)",
                color: "var(--fg-1)",
                outline: "none",
                resize: "none",
              }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={reset}
                style={{ flex: 1, padding: "14px", borderRadius: "var(--radius-pill)", background: "transparent", color: "var(--fg-3)", border: "1px solid var(--border-2)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleToken(token)}
                disabled={token.trim().length < 10}
                style={{ flex: 2, padding: "14px", borderRadius: "var(--radius-pill)", background: "var(--cw-fresh)", color: "white", border: "none", fontSize: "14px", fontWeight: 600, cursor: token.trim().length < 10 ? "default" : "pointer", opacity: token.trim().length < 10 ? 0.5 : 1 }}
              >
                Redeem
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <h1 style={hero}>Ready to scan.</h1>
          <p style={subtitle}>Point the camera at the customer&apos;s QR code to redeem their offer.</p>
          <div style={{ width: "100%", maxWidth: "320px", marginBottom: "24px" }}>
            <QRScanner onScan={handleToken} />
          </div>
          <button
            onClick={() => setState({ phase: "manual" })}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-body)",
              fontWeight: 600,
              padding: "16px 32px",
              borderRadius: "var(--radius-pill)",
              background: "var(--bg-card)",
              color: "var(--fg-1)",
              border: "1px solid var(--border-2)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "var(--shadow-2)",
            }}
          >
            <i className="ph ph-keyboard" style={{ fontSize: "20px" }} />
            Enter token manually
          </button>
        </>
      )}

      <MerchantBottomNav />
    </div>
  );
}

export default function MerchantScanPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg-page)", minHeight: "100vh" }} />}>
      <ScanContent />
    </Suspense>
  );
}
