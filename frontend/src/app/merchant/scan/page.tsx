"use client";

import { Suspense, useState } from "react";
import MerchantBottomNav from "@/components/MerchantBottomNav";

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
  background: "var(--cw-warm-bg)",
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

const scannerContainer: React.CSSProperties = {
  width: "100%",
  maxWidth: "320px",
  aspectRatio: "1/1",
  position: "relative",
  borderRadius: "var(--radius-4)",
  overflow: "hidden",
  background: "#0d0d0d",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "32px",
  boxShadow: "var(--shadow-3)",
  border: "8px solid var(--bg-card)",
};

const viewFinder: React.CSSProperties = {
  width: "70%",
  height: "70%",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: "var(--radius-3)",
  position: "relative",
};

const corner: React.CSSProperties = {
  position: "absolute",
  width: "24px",
  height: "24px",
  borderColor: "var(--cw-fresh)",
  borderStyle: "solid",
};

function ScanContent() {
  const [showManual, setShowManual] = useState(false);
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  const handleValidate = () => {
    setIsValidating(true);
    setResult(null);
    // Mock validation delay
    setTimeout(() => {
      setIsValidating(false);
      if (code.length === 6) {
        setResult("success");
        setTimeout(() => {
          setShowManual(false);
          setResult(null);
          setCode("");
        }, 2000);
      } else {
        setResult("error");
      }
    }, 800);
  };

  return (
    <div className="animate-fade-in" style={screenStyle}>
      <div style={iconContainer}>
        <i className={`ph ${result === "success" ? "ph-check-circle" : "ph-qr-code"}`} style={{ fontSize: "28px", color: result === "success" ? "var(--cw-fresh)" : "var(--cw-warm)" }} />
      </div>

      <h1 style={hero}>
        {result === "success" ? "Valid Code!" : showManual ? "Manual Entry" : "Ready to scan."}
      </h1>
      <p style={subtitle}>
        {result === "success" ? "The offer has been successfully redeemed." : showManual ? "Enter the 6-digit redemption code provided by the customer." : "Position the customer's QR code within the frame to validate their deal."}
      </p>

      {!showManual ? (
        <>
          <div style={scannerContainer}>
            {/* Mock Camera Feed Background */}
            <div style={{ 
              position: "absolute", 
              inset: 0, 
              opacity: 0.1, 
              background: "radial-gradient(circle at center, #333 0%, #000 100%)",
            }} />
            
            <div style={viewFinder}>
              <div style={{ ...corner, top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderRadius: "8px 0 0 0" }} />
              <div style={{ ...corner, top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderRadius: "0 8px 0 0" }} />
              <div style={{ ...corner, bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderRadius: "0 0 0 8px" }} />
              <div style={{ ...corner, bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderRadius: "0 0 8px 0" }} />
              <div className="scanning-line" style={{ position: "absolute", left: "4px", right: "4px", height: "2px", background: "var(--cw-fresh)", boxShadow: "0 0 12px var(--cw-fresh)", zIndex: 10, top: "0%" }} />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes scanMove {
                0% { top: 0%; opacity: 0.2; }
                50% { top: 100%; opacity: 1; }
                100% { top: 0%; opacity: 0.2; }
              }
              .scanning-line {
                animation: scanMove 3s infinite ease-in-out;
              }
            `}} />
          </div>

          <button 
            onClick={() => setShowManual(true)}
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
            Enter Code Manually
          </button>
        </>
      ) : (
        <div style={{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            style={{
              width: "100%",
              padding: "20px",
              fontSize: "32px",
              textAlign: "center",
              letterSpacing: "8px",
              fontFamily: "monospace",
              borderRadius: "var(--radius-3)",
              border: result === "error" ? "2px solid var(--action-primary)" : "1px solid var(--border-2)",
              background: "var(--bg-card)",
              color: "var(--fg-1)",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              onClick={() => { setShowManual(false); setResult(null); setCode(""); }}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "var(--radius-pill)",
                background: "transparent",
                color: "var(--fg-3)",
                border: "1px solid var(--border-2)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleValidate}
              disabled={isValidating || code.length < 6}
              style={{
                flex: 2,
                padding: "16px",
                borderRadius: "var(--radius-pill)",
                background: "var(--cw-fresh)",
                color: "white",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: (isValidating || code.length < 6) ? "default" : "pointer",
                opacity: (isValidating || code.length < 6) ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isValidating ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Validate Code"}
            </button>
          </div>

          {result === "error" && (
            <p style={{ fontSize: "13px", color: "var(--action-primary)", fontWeight: 600 }}>
              Invalid code. Please check and try again.
            </p>
          )}
        </div>
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
