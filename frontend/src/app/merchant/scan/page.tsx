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
    <div className="min-h-screen bg-page px-5 py-10">
      <header className="mx-auto mb-6 flex max-w-md items-center justify-between">
        <Link href="/merchant" className="inline-flex items-center gap-1 text-small text-fg-link no-underline">
          <i className="ph ph-arrow-left text-xs" />
          Back
        </Link>
        <h1
          className="font-display text-h2 text-fg-1"
          style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 60, "SOFT" 30' }}
        >
          Scan
        </h1>
        <span className="w-16" />
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

            <div className="rounded-4 border border-border-1 bg-card p-4 shadow-1">
              <label className="mb-2 block text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
                Or paste token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pasteValue}
                  onChange={(e) => setPasteValue(e.target.value)}
                  placeholder="Paste token here"
                  className="flex-1 rounded-2 border border-border-2 bg-card-soft px-3 py-2 font-mono text-small text-fg-1 outline-none focus:border-action-primary"
                />
                <button
                  onClick={() => handleToken(pasteValue.trim())}
                  disabled={!pasteValue.trim() || validating}
                  className="rounded-2 bg-action-primary px-4 py-2 text-small font-semibold text-fg-on-red disabled:opacity-40"
                >
                  Validate
                </button>
              </div>
            </div>
          </>
        )}

        {state.phase === "previewing" && (
          <div className="space-y-4 rounded-4 border border-border-1 bg-card p-6 shadow-2">
            <div>
              <p className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
                {state.offer.merchant_name}
              </p>
              <h2
                className="mt-1 font-display text-h2 text-fg-1"
                style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
              >
                {state.offer.headline}
              </h2>
              <p className="mt-1 text-small text-fg-2">{state.offer.subtext}</p>
            </div>
            <span className="inline-block rounded-pill bg-cw-cool-bg px-3 py-1 text-small font-semibold text-cw-cool">
              {state.offer.discount_value}
            </span>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-2 bg-cw-fresh px-5 py-3 text-small font-semibold text-white hover:opacity-90"
              >
                Confirm Redemption
              </button>
              <button
                onClick={reset}
                className="rounded-2 border border-border-2 bg-card px-5 py-3 text-small font-semibold text-fg-2 hover:bg-card-soft"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {state.phase === "success" && (
          <div className="rounded-4 border border-cw-fresh/30 bg-cw-fresh-bg p-8 text-center shadow-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-pill bg-cw-fresh text-fg-on-dark">
              <i className="ph-bold ph-check text-3xl" />
            </div>
            <p className="text-h3 font-semibold text-fg-1">{state.result.message}</p>
            {state.result.cashback_amount != null && (
              <p
                className="mt-2 font-display text-display tabular-nums text-cw-fresh"
                style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
              >
                +${state.result.cashback_amount.toFixed(2)}
              </p>
            )}
            <button
              onClick={reset}
              className="mt-6 rounded-2 bg-cw-paper-900 px-5 py-2 text-small font-semibold text-fg-on-dark"
            >
              Scan another
            </button>
          </div>
        )}

        {state.phase === "error" && (
          <div className="rounded-4 border border-status-danger/30 bg-cw-red-50 p-8 text-center shadow-1">
            <p className="text-h3 font-semibold text-status-danger">{state.message}</p>
            <button
              onClick={reset}
              className="mt-5 rounded-2 bg-cw-paper-900 px-5 py-2 text-small font-semibold text-fg-on-dark"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
