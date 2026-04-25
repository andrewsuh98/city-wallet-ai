"use client";

import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  onScan: (token: string) => void;
  onError?: (err: string) => void;
}

const REGION_ID = "qr-scanner-region";

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const startedRef = useRef(false);
  const [permissionState, setPermissionState] = useState<"pending" | "ok" | "error">("pending");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let scannerInstance: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;

    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (cancelled) return;
        const scanner = new Html5Qrcode(REGION_ID);
        scannerInstance = scanner as unknown as typeof scannerInstance;
        return scanner
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            (decodedText: string) => {
              const token = decodedText.includes("/")
                ? decodedText.split("/").pop() || decodedText
                : decodedText.trim();
              onScan(token);
            },
            () => {
              // per-frame "no qr" callback; ignore
            },
          )
          .then(() => {
            if (!cancelled) setPermissionState("ok");
          });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setPermissionState("error");
        onError?.(err.message || "Camera unavailable");
      });

    return () => {
      cancelled = true;
      if (scannerInstance) {
        scannerInstance
          .stop()
          .then(() => scannerInstance?.clear())
          .catch(() => {});
      }
    };
  }, [onScan, onError]);

  return (
    <div className="w-full">
      <div
        id={REGION_ID}
        className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-black"
        style={{ minHeight: 280 }}
      />
      {permissionState === "error" && (
        <p className="mt-3 text-center text-xs text-white/60">
          Camera unavailable. Use the paste field below.
        </p>
      )}
    </div>
  );
}
