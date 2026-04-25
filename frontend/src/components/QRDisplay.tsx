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
        className="flex flex-col items-center justify-center rounded-2xl bg-[#1A1A1A] p-6 text-center"
        style={{ width: size, height: size }}
      >
        <p className="mb-3 text-sm text-red-300">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setData(null);
            getOfferQR(offerId).then(setData).catch((e) => setError(e.message));
          }}
          className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="animate-pulse rounded-2xl bg-[#1A1A1A]"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-2xl bg-white p-3"
        style={{ width: size, height: size }}
      >
        <img
          src={`data:image/png;base64,${data.qr_base64}`}
          alt="Redemption QR code"
          className="h-full w-full object-contain"
        />
      </div>
      <code className="select-all break-all rounded-lg bg-[#1A1A1A] px-3 py-2 font-mono text-xs text-white/70">
        {data.token}
      </code>
    </div>
  );
}
