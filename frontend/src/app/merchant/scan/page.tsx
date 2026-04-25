"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import QRScanner from "@/components/QRScanner";
import { redeemOffer, validateToken } from "@/lib/api";
import type { Offer, RedemptionResult, TokenValidationResponse } from "@/lib/types";

type ScanState =
  | { phase: "scanning"; cameraError: string | null }
  | { phase: "previewing"; offer: Offer; token: string }
  | { phase: "success"; result: RedemptionResult }
  | { phase: "error"; message: string };

export default function MerchantScanPage() {
  const [state, setState] = useState<ScanState>({ phase: "scanning", cameraError: null });
  const [pasteValue, setPasteValue] = useState("");
  const [validating, setValidating] = useState(false);

  const handleToken = useCallback(async (token: string) => {
    if (!token) return;
    setValidating(true);
    try {
      const res: TokenValidationResponse = await validateToken(token);
      if (!res.valid || !res.offer) {
        setState({ phase: "error", message: "Invalid or expired token." });
        return;
      }
      setState({ phase: "previewing", offer: res.offer, token });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Validation failed";
      setState({ phase: "error", message: msg });
    } finally {
      setValidating(false);
    }
  }, []);

  const handleConfirm = async () => {
    if (state.phase !== "previewing") return;
    try {
      const result = await redeemOffer(state.offer.id, state.token);
      if (!result.success) {
        setState({ phase: "error", message: result.message });
        return;
      }
      setState({ phase: "success", result });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Redemption failed";
      setState({ phase: "error", message: msg });
    }
  };

  const reset = () => {
    setPasteValue("");
    setState({ phase: "scanning", cameraError: null });
  };

  return (
    <div className="min-h-screen px-5 py-8">
      <header className="mx-auto mb-6 flex max-w-md items-center justify-between">
        <Link href="/merchant" className="text-sm text-white/60 hover:text-white">
          Back to dashboard
        </Link>
        <h1 className="text-lg font-semibold text-white">Scan</h1>
        <span className="w-24" />
      </header>

      <div className="mx-auto max-w-md space-y-5">
        {state.phase === "scanning" && (
          <>
            <QRScanner
              onScan={handleToken}
              onError={(err) =>
                setState({ phase: "scanning", cameraError: err })
              }
            />

            <div className="rounded-2xl bg-[#1A1A1A] p-4">
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
                Or paste token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pasteValue}
                  onChange={(e) => setPasteValue(e.target.value)}
                  placeholder="Paste token here"
                  className="flex-1 rounded-lg bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none ring-1 ring-white/10 focus:ring-blue-400/50"
                />
                <button
                  onClick={() => handleToken(pasteValue.trim())}
                  disabled={!pasteValue.trim() || validating}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  Validate
                </button>
              </div>
            </div>
          </>
        )}

        {state.phase === "previewing" && (
          <div className="space-y-4 rounded-2xl bg-[#1A1A1A] p-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                {state.offer.merchant_name}
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                {state.offer.headline}
              </h2>
              <p className="mt-1 text-sm text-white/70">{state.offer.subtext}</p>
            </div>
            <span className="inline-block rounded-full border border-blue-400/40 px-3 py-1 text-sm font-semibold text-blue-300">
              {state.offer.discount_value}
            </span>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
              >
                Confirm Redemption
              </button>
              <button
                onClick={reset}
                className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {state.phase === "success" && (
          <div className="rounded-2xl bg-emerald-500/10 p-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-300">
              v
            </div>
            <p className="text-lg font-semibold text-white">{state.result.message}</p>
            {state.result.cashback_amount != null && (
              <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-400">
                +${state.result.cashback_amount.toFixed(2)}
              </p>
            )}
            <button
              onClick={reset}
              className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
            >
              Scan another
            </button>
          </div>
        )}

        {state.phase === "error" && (
          <div className="rounded-2xl bg-red-500/10 p-8 text-center">
            <p className="text-lg font-semibold text-red-300">{state.message}</p>
            <button
              onClick={reset}
              className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
