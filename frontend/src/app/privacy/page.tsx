"use client";

import { clearConsent, getConsent } from "@/components/ConsentModal";
import { useRouter } from "next/navigation";

const SECTION_TITLE = "mb-3 mt-8 font-body text-h3 font-semibold leading-snug text-fg-1";
const BODY = "mb-8 font-body text-body leading-normal text-fg-2";
const CARD = "mb-4 rounded-3 border border-border-1 bg-card p-4";
const CARD_ROW = "mb-3 flex items-start gap-3 last:mb-0";
const CARD_ICON = "shrink-0 mt-px text-xl text-fg-3";

export default function PrivacyPage() {
  const router = useRouter();
  const isOnboarded = getConsent() !== null;

  const handleClearData = () => {
    clearConsent();
    router.push("/");
  };

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-page px-5 pt-10 pb-24">
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1 border-none bg-transparent p-0 font-body text-small text-fg-link cursor-pointer"
      >
        <i className="ph ph-arrow-left text-sm" />
        Back
      </button>

      <h1
        className="mb-2 font-display text-h1 font-medium leading-snug text-fg-1"
        style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 60, "SOFT" 30' }}
      >
        How your data is handled
      </h1>
      <p className={BODY}>
        City Wallet is designed around a simple principle: your data stays on your phone. Here is exactly what happens when you use the app.
      </p>

      <h2 className={SECTION_TITLE}>How it works</h2>

      <div className={CARD}>
        <div className={CARD_ROW}>
          <i className={`ph ph-device-mobile ${CARD_ICON}`} />
          <div>
            <div className="mb-1 text-body font-semibold text-fg-1">On your device</div>
            <div className="text-small leading-normal text-fg-2">
              GPS coordinates, movement patterns, and preferences are processed locally. Raw data never leaves the phone.
            </div>
          </div>
        </div>
        <div className={CARD_ROW}>
          <i className="ph ph-arrow-down shrink-0 mt-px text-xl text-fg-4" />
          <div className="text-small text-fg-3">
            Only abstract intent signals cross the network
          </div>
        </div>
        <div className="flex items-start gap-3">
          <i className={`ph ph-cloud ${CARD_ICON}`} />
          <div>
            <div className="mb-1 text-body font-semibold text-fg-1">Server</div>
            <div className="text-small leading-normal text-fg-2">
              Receives intent tags and a single coordinate. Combines with public context (weather, time, events) to generate offers. No movement history, no browsing data, no personal info.
            </div>
          </div>
        </div>
      </div>

      <h2 className={SECTION_TITLE}>What we collect</h2>

      <table className="mb-6 w-full border-collapse font-body text-small">
        <thead>
          <tr>
            <th className="border-b border-border-2 px-0 py-2 pr-2 text-left text-micro font-semibold uppercase tracking-[0.08em] text-fg-1">Data</th>
            <th className="border-b border-border-2 px-0 py-2 pr-2 text-left text-micro font-semibold uppercase tracking-[0.08em] text-fg-1">Stored</th>
            <th className="border-b border-border-2 px-0 py-2 pr-2 text-left text-micro font-semibold uppercase tracking-[0.08em] text-fg-1">Retention</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["GPS coordinate", "No", "Discarded after request"],
            ["Session ID (random UUID)", "24h", "Then purged"],
            ["Offer interactions", "Aggregated", "Not linked to you after 24h"],
            ["Intent signals", "No", "Current request only"],
          ].map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i} className="border-b border-border-1 px-0 py-2.5 pr-2 align-top text-fg-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={SECTION_TITLE}>What we do not collect</h2>

      <div className="mb-6 flex flex-col gap-2">
        {[
          "Name, email, phone, or any personal information",
          "Movement history or GPS traces",
          "Browsing history or app usage",
          "Device identifiers or IP addresses",
          "Cookies or cross-session tracking",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <i className="ph ph-x shrink-0 text-sm text-fg-4" />
            <span className="text-small text-fg-2">{item}</span>
          </div>
        ))}
      </div>

      <h2 className={SECTION_TITLE}>GDPR compliance</h2>

      <div className={CARD}>
        {[
          { article: "Art. 5", label: "Data minimization", desc: "Only the minimum data needed for offer generation." },
          { article: "Art. 6", label: "Lawful basis", desc: "Explicit consent via the location prompt. Works without it." },
          { article: "Art. 7", label: "Consent", desc: "Freely given, specific, informed, and revocable." },
          { article: "Art. 17", label: "Right to erasure", desc: "Clear your data below. Server purges after 24h." },
          { article: "Art. 25", label: "Privacy by design", desc: "On-device processing. No PII touches the server." },
        ].map((item) => (
          <div key={item.article} className="mb-3 flex items-start gap-3 last:mb-0">
            <span className="w-12 shrink-0 font-mono text-micro font-medium text-fg-3">
              {item.article}
            </span>
            <div>
              <div className="mb-0.5 text-small font-semibold text-fg-1">
                {item.label}
              </div>
              <div className="text-small leading-normal text-fg-2">
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isOnboarded && (
        <>
          <h2 className={SECTION_TITLE}>Clear my data</h2>
          <p className="mb-4 font-body text-body leading-normal text-fg-2">
            This removes your consent, preferences, and all locally stored data. The app will show the welcome screen again.
          </p>

          <button
            onClick={handleClearData}
            className="w-full rounded-2 border border-status-danger bg-transparent px-6 py-3 font-body text-body font-semibold text-status-danger hover:bg-cw-red-50"
          >
            Clear all data and revoke consent
          </button>
        </>
      )}
    </div>
  );
}
