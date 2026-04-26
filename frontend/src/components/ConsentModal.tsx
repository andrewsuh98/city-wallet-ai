"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
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

// -- Shared classes --

const SCREEN_BASE = "flex min-h-screen flex-col items-center bg-page px-6 py-10 text-center";
const SCREEN_CENTER = `${SCREEN_BASE} justify-center`;
const SCREEN_TOP = `${SCREEN_BASE} justify-start pt-20`;

const HERO_STYLE = { letterSpacing: "var(--ls-tight)", textWrap: "balance" as const, fontVariationSettings: '"opsz" 96, "SOFT" 50' };
const HERO_CLS = "mb-4 max-w-[300px] font-display text-[36px] font-medium leading-[1.08] text-fg-1";
const SUBTITLE_CLS = "mb-10 max-w-[280px] font-body text-body leading-normal text-fg-2";

const PRIMARY_BTN =
  "inline-flex w-full max-w-[320px] items-center justify-center gap-2 rounded-2 bg-action-primary px-7 py-3.5 font-body text-body font-semibold text-fg-on-red transition-colors duration-150 hover:bg-action-primary-hover disabled:opacity-40 disabled:cursor-default";

const GHOST_BTN =
  "w-full max-w-[320px] rounded-2 border border-border-2 bg-transparent px-7 py-3.5 font-body text-body font-semibold text-fg-1 hover:bg-card-soft";

// -- Screen 1: Welcome --

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className={SCREEN_CENTER}>
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-3 bg-cw-red-500">
        <i className="ph ph-wallet text-[28px] text-fg-on-red" />
      </div>

      <h1 className={HERO_CLS} style={HERO_STYLE}>
        Shop local. Save local.
      </h1>

      <p className={SUBTITLE_CLS}>
        Discover real-time offers from small businesses near you.
      </p>

      <button onClick={onNext} className={PRIMARY_BTN}>
        Get started
        <i className="ph ph-arrow-right text-base" />
      </button>
    </div>
  );
}

// -- Screen 2: Profile --

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

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
    <div className={SCREEN_TOP}>
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-pill bg-cw-fresh-bg">
        <i className="ph ph-user text-[28px] text-cw-fresh" />
      </div>

      <h1 className={HERO_CLS} style={HERO_STYLE}>What should we call you?</h1>
      <p className={SUBTITLE_CLS}>Just a first name. Nothing formal.</p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="First name"
        autoFocus
        className="w-full max-w-[320px] rounded-2 border border-border-2 bg-card px-4 py-3.5 text-center font-body text-body text-fg-1 outline-none focus:border-action-primary"
      />

      <div className="mb-8 mt-7 w-full max-w-[320px]">
        <div className="mb-2.5 text-micro font-semibold uppercase tracking-[0.08em] text-fg-4">
          Gender {"\u00b7"} optional
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {GENDER_OPTIONS.map((opt) => {
            const isSelected = gender === opt;
            return (
              <button
                key={opt}
                onClick={() => setGender(isSelected ? null : opt)}
                className={`rounded-pill px-3.5 py-2 font-body text-small font-semibold transition-colors duration-150 ${
                  isSelected
                    ? "border-2 border-cw-fresh bg-cw-fresh-bg text-cw-fresh"
                    : "border border-border-2 bg-card text-fg-2 hover:bg-card-soft"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={handleNext} disabled={!canProceed} className={PRIMARY_BTN}>
        Continue
        <i className="ph ph-arrow-right text-base" />
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
    <div className={SCREEN_TOP}>
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-pill bg-cw-warm-bg">
        <i className="ph ph-heart text-[28px] text-cw-warm" />
      </div>

      <h1 className={HERO_CLS} style={HERO_STYLE}>What catches your eye?</h1>
      <p className={SUBTITLE_CLS}>Pick at least 3. We will show you relevant offers first.</p>

      <div className="mb-7 grid w-full max-w-[320px] grid-cols-3 gap-2.5">
        {TASTE_OPTIONS.map((option) => {
          const isSel = selected.has(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggle(option.id)}
              className={`flex flex-col items-center gap-1.5 rounded-3 px-1 py-3.5 font-body text-small font-semibold transition-colors duration-150 ${
                isSel
                  ? "border-2 border-cw-warm bg-cw-warm-bg text-cw-warm"
                  : "border border-border-2 bg-card text-fg-2 hover:bg-card-soft"
              }`}
            >
              {option.id === "bubble_tea" ? (
                <BubbleTeaIcon size={24} />
              ) : (
                <i className={`ph ${option.icon} text-2xl`} />
              )}
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex w-full max-w-[320px] flex-col gap-3">
        <button onClick={handleNext} disabled={!canProceed} className={PRIMARY_BTN}>
          {canProceed ? "Show me what is nearby" : remaining === MIN_SELECTIONS ? `Pick ${MIN_SELECTIONS} to continue` : `Pick ${remaining} more`}
          {canProceed && <i className="ph ph-arrow-right text-base" />}
        </button>

        <button onClick={onSkip} className={GHOST_BTN}>
          Skip, show me everything
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
    <div className={SCREEN_CENTER}>
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-pill bg-cw-cool-bg">
        <i className="ph ph-map-pin text-[28px] text-cw-cool" />
      </div>

      <h1 className={HERO_CLS} style={HERO_STYLE}>
        Find offers within walking distance.
      </h1>

      <p className={SUBTITLE_CLS}>
        Location is used for 4 seconds per refresh. Nothing leaves your phone.
      </p>

      <div className="mb-7 flex w-full max-w-[320px] flex-col gap-3">
        <button onClick={handleEnable} className={PRIMARY_BTN}>
          Enable location
          <i className="ph ph-arrow-right text-base" />
        </button>

        <button onClick={handleSkip} className={GHOST_BTN}>
          Not now, use default location
        </button>
      </div>

      <Link
        href="/privacy"
        className="border-b border-current font-body text-small text-fg-link no-underline"
      >
        How your data is handled {"\u2192"}
      </Link>
    </div>
  );
}

// -- Main component: 4-step flow --

const STEP_KEY = "city_wallet_onboarding_step";

function readStep(): 1 | 2 | 3 | 4 {
  if (typeof window === "undefined") return 1;
  const n = Number(sessionStorage.getItem(STEP_KEY));
  return n >= 1 && n <= 4 ? (n as 1 | 2 | 3 | 4) : 1;
}

export default function ConsentModal({ onConsent }: ConsentModalProps) {
  const [step, setStepState] = useState<1 | 2 | 3 | 4>(readStep);

  const setStep = (s: 1 | 2 | 3 | 4) => {
    sessionStorage.setItem(STEP_KEY, String(s));
    setStepState(s);
  };

  const handleConsent = (locationEnabled: boolean) => {
    sessionStorage.removeItem(STEP_KEY);
    onConsent(locationEnabled);
  };

  if (step === 1) return <WelcomeScreen onNext={() => setStep(2)} />;
  if (step === 2) return <ProfileScreen onNext={() => setStep(3)} />;
  if (step === 3) return <TasteScreen onNext={() => setStep(4)} onSkip={() => setStep(4)} />;
  return <LocationScreen onConsent={handleConsent} />;
}
