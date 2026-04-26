/**
 * Simulated on-device SLM layer (see docs/privacy-gdpr.md).
 * In production this module would be replaced by a real on-device model that
 * processes raw signals locally. Here we derive the same CustomerIntent shape
 * from localStorage signals so the server-side code is identical either way.
 * No raw profile data leaves the device — only the abstracted CustomerIntent.
 */

import { getConsent, getTaste } from "@/components/ConsentModal";
import type { CustomerIntent, MerchantCategory } from "@/lib/types";

export const TASTE_TO_MERCHANT: Record<string, MerchantCategory> = {
  coffee: "cafe",
  bubble_tea: "cafe",
  pizza: "restaurant",
  sushi: "restaurant",
  burgers: "restaurant",
  brunch: "restaurant",
  tacos: "restaurant",
  ramen: "restaurant",
  bakery: "bakery",
  desserts: "bakery",
  cocktails: "bar",
  healthy: "restaurant",
};

const DECLINED_KEY_PREFIX = "city_wallet_declined_";

function todayKey(): string {
  return DECLINED_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

export function trackDeclinedCategory(category: MerchantCategory): void {
  if (typeof window === "undefined") return;
  const key = todayKey();
  const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
  if (!existing.includes(category)) {
    existing.push(category);
    localStorage.setItem(key, JSON.stringify(existing));
  }
}

function getDeclinedToday(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(todayKey()) ?? "[]");
}

function getSessionDwellSeconds(): number | null {
  const consent = getConsent();
  if (!consent) return null;
  const start = new Date(consent.consent_timestamp).getTime();
  return Math.floor((Date.now() - start) / 1000);
}

export function buildCustomerIntent(): CustomerIntent {
  const taste = getTaste();
  const preferred_categories = taste
    ? ([
        ...new Set(
          taste.categories
            .map((c) => TASTE_TO_MERCHANT[c])
            .filter((c): c is MerchantCategory => Boolean(c)),
        ),
      ] as string[])
    : [];

  return {
    intent_tags: [],
    preferred_categories,
    price_sensitivity: null,
    movement_state: null,
    session_dwell_seconds: getSessionDwellSeconds(),
    declined_categories_today: getDeclinedToday(),
  };
}
