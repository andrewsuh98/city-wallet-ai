"use client";

import { useEffect, useState } from "react";
import { getOfferQR } from "@/lib/api";

interface QRDisplayProps {
  offerId: string;
  size?: number;
}

interface QRData {
  qr_base64: string;
  token: string;
  expires_at: string;
}

export default function QRDisplay({ offerId, size = 280 }: QRDisplayProps) {
  const [data, setData] = useState<QRData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    getOfferQR(offerId)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message || "Failed to load QR");
      });
    return () => {
      alive = false;
    };
  }, [offerId]);

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-4 border border-status-danger/30 bg-cw-red-50 p-6 text-center"
        style={{ width: size, height: size }}
      >
        <p className="mb-3 text-small text-status-danger">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setData(null);
            getOfferQR(offerId).then(setData).catch((e) => setError(e.message));
          }}
          className="rounded-2 bg-action-primary px-4 py-1.5 text-micro font-semibold text-fg-on-red"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="animate-pulse rounded-4 bg-card-soft"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-4 border border-border-1 bg-white p-3 shadow-2"
        style={{ width: size, height: size }}
      >
        <img
          src={`data:image/png;base64,${data.qr_base64}`}
          alt="Redemption QR code"
          className="h-full w-full object-contain"
        />
      </div>
      <code className="select-all break-all rounded-2 border border-border-1 bg-card-soft px-3 py-2 font-mono text-micro text-fg-2">
        {data.token}
      </code>
    </div>
  );
}
