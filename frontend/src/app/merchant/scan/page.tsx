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
  return (
    <div className="animate-fade-in" style={screenStyle}>
      <div style={iconContainer}>
        <i className="ph ph-qr-code" style={{ fontSize: "28px", color: "var(--cw-warm)" }} />
      </div>

      <h1 style={hero}>Ready to scan.</h1>
      <p style={subtitle}>Position the customer's QR code within the frame to validate their deal.</p>

      <div style={scannerContainer}>
        {/* Mock Camera Feed Background */}
        <div style={{ 
          position: "absolute", 
          inset: 0, 
          opacity: 0.1, 
          background: "radial-gradient(circle at center, #333 0%, #000 100%)",
        }} />
        
        {/* Scanning Light Effect */}
        <div style={{ 
          position: "absolute", 
          inset: 0, 
          background: "linear-gradient(to bottom, transparent, rgba(52, 199, 89, 0.05), transparent)",
          height: "40px",
          top: "40%",
          filter: "blur(10px)",
        }} />

        <div style={viewFinder}>
          {/* Viewfinder corners */}
          <div style={{ ...corner, top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderRadius: "8px 0 0 0" }} />
          <div style={{ ...corner, top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderRadius: "0 8px 0 0" }} />
          <div style={{ ...corner, bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderRadius: "0 0 0 8px" }} />
          <div style={{ ...corner, bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderRadius: "0 0 8px 0" }} />
          
          {/* Animated Scanning Line */}
          <div 
            className="scanning-line"
            style={{ 
              position: "absolute", 
              left: "4px", 
              right: "4px", 
              height: "2px", 
              background: "var(--cw-fresh)", 
              boxShadow: "0 0 12px var(--cw-fresh)",
              zIndex: 10,
              top: "0%"
            }} 
          />
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

      <button style={{
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
        transition: "transform 0.1s active"
      }}>
        <i className="ph ph-keyboard" style={{ fontSize: "20px" }} />
        Enter Code Manually
      </button>

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
