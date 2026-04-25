"use client";

import { useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import Link from "next/link";

// -- Types --

interface ConsentState {
  location_consent: boolean;
  consent_timestamp: string;
  version: string;
}

interface UserProfile {
  first_name: string;
  gender: string | null;
  timestamp: string;
}

interface TastePreferences {
  categories: string[];
  timestamp: string;
}

interface ConsentModalProps {
  onConsent: (locationEnabled: boolean) => void;
}

// -- Storage --

const CONSENT_KEY = "city_wallet_consent";
const PROFILE_KEY = "city_wallet_profile";
const TASTE_KEY = "city_wallet_taste";

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

export function setConsent(locationEnabled: boolean): void {
  const state: ConsentState = {
    location_consent: locationEnabled,
    consent_timestamp: new Date().toISOString(),
    version: "1.0",
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
}

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setProfile(firstName: string, gender: string | null): void {
  const profile: UserProfile = {
    first_name: firstName,
    gender,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getTaste(): TastePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TASTE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TastePreferences;
  } catch {
    return null;
  }
}

export function setTaste(categories: string[]): void {
  const prefs: TastePreferences = {
    categories,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(TASTE_KEY, JSON.stringify(prefs));
}

export function clearConsent(): void {
  localStorage.removeItem(CONSENT_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(TASTE_KEY);
}

// -- Shared styles --

const screen: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: "40px 24px",
  background: "var(--bg-page)",
  textAlign: "center",
};

const hero: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "36px",
  lineHeight: "1.08",
  letterSpacing: "var(--ls-tight)",
  fontWeight: 500,
  color: "var(--fg-1)",
  marginBottom: "16px",
  maxWidth: "300px",
  fontVariationSettings: '"opsz" 96, "SOFT" 50',
  textWrap: "balance",
};

const subtitle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  lineHeight: "var(--lh-normal)",
  color: "var(--fg-2)",
  maxWidth: "280px",
  marginBottom: "40px",
};

const primaryBtn: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  fontWeight: 600,
  padding: "14px 28px",
  borderRadius: "var(--radius-2)",
  background: "var(--action-primary)",
  color: "var(--fg-on-red)",
  border: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  width: "100%",
  maxWidth: "320px",
  justifyContent: "center",
};

const ghostBtn: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  fontWeight: 600,
  padding: "14px 28px",
  borderRadius: "var(--radius-2)",
  background: "transparent",
  color: "var(--fg-1)",
  border: "1px solid var(--border-2)",
  cursor: "pointer",
  width: "100%",
  maxWidth: "320px",
};

// -- Screen 1: Welcome --

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div style={screen}>
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-3)",
          background: "var(--cw-red-500)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
        }}
      >
        <i className="ph ph-wallet" style={{ fontSize: "28px", color: "var(--fg-on-red)" }} />
      </div>

      <h1 style={hero}>
        The right offer, right when you need it.
      </h1>

      <p style={subtitle}>
        City Wallet finds what is nearby, open, and worth your time.
      </p>

      <button onClick={onNext} style={primaryBtn}>
        Get started
        <i className="ph ph-arrow-right" style={{ fontSize: "16px" }} />
      </button>
    </div>
  );
}

// -- Screen 2: Profile --

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const inputStyle: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-body)",
  padding: "14px 16px",
  borderRadius: "var(--radius-2)",
  border: "1px solid var(--border-2)",
  background: "var(--bg-card)",
  color: "var(--fg-1)",
  width: "100%",
  maxWidth: "320px",
  outline: "none",
  textAlign: "center",
};

function ProfileScreen({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<string | null>(null);

  const canProceed = name.trim().length > 0;

  const handleNext = () => {
    setProfile(name.trim(), gender);
    onNext();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canProceed) handleNext();
  };

  return (
    <div style={{ ...screen, justifyContent: "flex-start", paddingTop: "80px" }}>
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-pill)",
          background: "var(--cw-fresh-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
        }}
      >
        <i className="ph ph-user" style={{ fontSize: "28px", color: "var(--cw-fresh)" }} />
      </div>

      <h1 style={hero}>What should we call you?</h1>
      <p style={subtitle}>Just a first name. Nothing formal.</p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="First name"
        autoFocus
        style={inputStyle}
      />

      <div style={{ width: "100%", maxWidth: "320px", marginTop: "28px", marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-micro)",
            fontWeight: 600,
            letterSpacing: "var(--ls-caps)",
            textTransform: "uppercase",
            color: "var(--fg-4)",
            marginBottom: "10px",
          }}
        >
          Gender · optional
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
          {GENDER_OPTIONS.map((opt) => {
            const isSelected = gender === opt;
            return (
              <button
                key={opt}
                onClick={() => setGender(isSelected ? null : opt)}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-small)",
                  fontWeight: 600,
                  padding: "8px 14px",
                  borderRadius: "var(--radius-pill)",
                  border: isSelected ? "2px solid var(--cw-fresh)" : "1px solid var(--border-2)",
                  background: isSelected ? "var(--cw-fresh-bg)" : "var(--bg-card)",
                  color: isSelected ? "var(--cw-fresh)" : "var(--fg-2)",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!canProceed}
        style={{
          ...primaryBtn,
          opacity: canProceed ? 1 : 0.4,
          cursor: canProceed ? "pointer" : "default",
        }}
      >
        Continue
        <i className="ph ph-arrow-right" style={{ fontSize: "16px" }} />
      </button>
    </div>
  );
}

// -- Custom icons --

function BubbleTeaIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="152" y1="20" x2="136" y2="80" />
      <line x1="56" y1="80" x2="200" y2="80" />
      <path d="M72 80l12 148a8 8 0 0 0 8 7h72a8 8 0 0 0 8-7l12-148" />
      <circle cx="112" cy="176" r="12" fill="currentColor" stroke="none" />
      <circle cx="144" cy="168" r="12" fill="currentColor" stroke="none" />
      <circle cx="120" cy="204" r="12" fill="currentColor" stroke="none" />
      <circle cx="152" cy="200" r="12" fill="currentColor" stroke="none" />
    </svg>
  );
}


// -- Screen 3: Taste preferences --

interface TasteOption {
  id: string;
  label: string;
  icon: string;
}

const TASTE_OPTIONS: TasteOption[] = [
  { id: "coffee", label: "Coffee", icon: "ph-coffee" },
  { id: "bubble_tea", label: "Bubble tea", icon: "ph-cup" },
  { id: "pizza", label: "Pizza", icon: "ph-pizza" },
  { id: "sushi", label: "Sushi", icon: "ph-fish" },
  { id: "burgers", label: "Burgers", icon: "ph-hamburger" },
  { id: "brunch", label: "Brunch", icon: "ph-avocado" },
  { id: "tacos", label: "Tacos", icon: "ph-pepper" },
  { id: "ramen", label: "Ramen", icon: "ph-bowl-food" },
  { id: "bakery", label: "Bakery", icon: "ph-cookie" },
  { id: "desserts", label: "Desserts", icon: "ph-ice-cream" },
  { id: "cocktails", label: "Cocktails", icon: "ph-wine" },
  { id: "healthy", label: "Healthy", icon: "ph-leaf" },
];

const MIN_SELECTIONS = 3;

const tasteItem = (isSelected: boolean): CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  padding: "14px 4px",
  borderRadius: "var(--radius-3)",
  border: isSelected ? "2px solid var(--cw-warm)" : "1px solid var(--border-2)",
  background: isSelected ? "var(--cw-warm-bg)" : "var(--bg-card)",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-small)",
  fontWeight: 600,
  color: isSelected ? "var(--cw-warm)" : "var(--fg-2)",
  transition: "all 120ms ease",
});

function TasteScreen({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canProceed = selected.size >= MIN_SELECTIONS;
  const remaining = MIN_SELECTIONS - selected.size;

  const handleNext = () => {
    setTaste(Array.from(selected));
    onNext();
  };

  return (
    <div style={{ ...screen, justifyContent: "flex-start", paddingTop: "80px" }}>
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-pill)",
          background: "var(--cw-warm-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
        }}
      >
        <i className="ph ph-heart" style={{ fontSize: "28px", color: "var(--cw-warm)" }} />
      </div>

      <h1 style={hero}>What catches your eye?</h1>
      <p style={subtitle}>Pick at least 3. We will show you relevant offers first.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "10px",
          width: "100%",
          maxWidth: "320px",
          marginBottom: "28px",
        }}
      >
        {TASTE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => toggle(option.id)}
            style={tasteItem(selected.has(option.id))}
          >
            {option.id === "bubble_tea" ? (
              <BubbleTeaIcon size={24} />
            ) : (
              <i className={`ph ${option.icon}`} style={{ fontSize: "24px" }} />
            )}
            {option.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px" }}>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          style={{
            ...primaryBtn,
            opacity: canProceed ? 1 : 0.4,
            cursor: canProceed ? "pointer" : "default",
          }}
        >
          {canProceed ? "Show me what's nearby" : remaining === MIN_SELECTIONS ? `Pick ${MIN_SELECTIONS} to continue` : `Pick ${remaining} more`}
          {canProceed && <i className="ph ph-arrow-right" style={{ fontSize: "16px" }} />}
        </button>

        <button onClick={onSkip} style={ghostBtn}>
          Skip — show me everything
        </button>
      </div>
    </div>
  );
}

// -- Screen 4: Location consent --

function LocationScreen({ onConsent }: ConsentModalProps) {
  const handleEnable = () => {
    setConsent(true);
    onConsent(true);
  };

  const handleSkip = () => {
    setConsent(false);
    onConsent(false);
  };

  return (
    <div style={screen}>
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-pill)",
          background: "var(--cw-cool-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
        }}
      >
        <i className="ph ph-map-pin" style={{ fontSize: "28px", color: "var(--cw-cool)" }} />
      </div>

      <h1 style={hero}>
        Find offers within walking distance.
      </h1>

      <p style={subtitle}>
        Location is used for 4 seconds per refresh. Nothing leaves your phone.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px", marginBottom: "28px" }}>
        <button onClick={handleEnable} style={primaryBtn}>
          Enable location
          <i className="ph ph-arrow-right" style={{ fontSize: "16px" }} />
        </button>

        <button onClick={handleSkip} style={ghostBtn}>
          Not now — use default location
        </button>
      </div>

      <Link
        href="/privacy"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-small)",
          color: "var(--fg-link)",
          textDecoration: "none",
          borderBottom: "1px solid currentColor",
        }}
      >
        How your data is handled →
      </Link>
    </div>
  );
}

// -- Main component: 4-step flow --

export default function ConsentModal({ onConsent }: ConsentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  if (step === 1) return <WelcomeScreen onNext={() => setStep(2)} />;
  if (step === 2) return <ProfileScreen onNext={() => setStep(3)} />;
  if (step === 3) return <TasteScreen onNext={() => setStep(4)} onSkip={() => setStep(4)} />;
  return <LocationScreen onConsent={onConsent} />;
}
