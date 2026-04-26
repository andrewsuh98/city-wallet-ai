"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateOffers, getContext, updateOffer } from "@/lib/api";
import { mockOffers } from "@/lib/mockOffers";
import type { ContextState, Offer } from "@/lib/types";
import { getSessionId } from "@/lib/session";
import type { DemoMode } from "@/lib/demo";

const CACHE_KEY = "cw_offers_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;
const LOCATION_THRESHOLD_M = 100;

interface OfferCacheEntry {
  offers: Offer[];
  context: ContextState;
  latitude: number;
  longitude: number;
  fetchedAt: number;
  demoMode: string | null;
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readCache(): OfferCacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as OfferCacheEntry) : null;
  } catch {
    return null;
  }
}

function writeCache(entry: OfferCacheEntry): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — skip silently
  }
}

function isCacheValid(
  entry: OfferCacheEntry,
  latitude: number,
  longitude: number,
  demoMode: DemoMode | null,
): boolean {
  const age = Date.now() - entry.fetchedAt;
  const dist = haversineMeters(
    latitude,
    longitude,
    entry.latitude,
    entry.longitude,
  );
  return (
    age < CACHE_TTL_MS &&
    dist < LOCATION_THRESHOLD_M &&
    entry.demoMode === demoMode
  );
}

export type OffersStatus = "idle" | "loading" | "ready" | "error" | "fallback";

export interface UseOffersResult {
  offers: Offer[];
  context: ContextState | null;
  status: OffersStatus;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  acceptOffer: (id: string) => Promise<Offer | null>;
  dismissOffer: (id: string) => Promise<void>;
}

interface UseOffersInput {
  enabled: boolean;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  demoMode: DemoMode | null;
  intentTags?: string[];
  pastCategories?: string[];
}

export function useOffers(input: UseOffersInput): UseOffersResult {
  const {
    enabled,
    latitude,
    longitude,
    accuracy,
    demoMode,
    intentTags,
    pastCategories,
  } = input;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [context, setContext] = useState<ContextState | null>(null);
  const [status, setStatus] = useState<OffersStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchOffers = useCallback(async () => {
    const sid = getSessionId();
    if (!sid) return;

    const cached = readCache();
    if (cached && isCacheValid(cached, latitude, longitude, demoMode)) {
      setContext(cached.context);
      setOffers(cached.offers);
      setStatus("ready");
      return;
    }

    const myRequest = ++requestId.current;
    setStatus("loading");
    setErrorMessage(null);

    try {
      const ctx = await getContext(
        { latitude, longitude, accuracy_meters: accuracy ?? undefined },
        demoMode,
      );
      if (myRequest !== requestId.current) return;
      setContext(ctx);

      const res = await generateOffers({
        session_id: sid,
        context: ctx,
        max_offers: 6,
        user_preferences: {
          intent_tags: intentTags ?? [],
          past_categories: pastCategories ?? [],
        },
      });

      if (myRequest !== requestId.current) return;
      if (res.offers.length === 0) {
        setOffers(mockOffers);
        setStatus("fallback");
        setErrorMessage(
          "No live offers matched your context. Showing examples.",
        );
      } else {
        writeCache({
          offers: res.offers,
          context: ctx,
          latitude,
          longitude,
          fetchedAt: Date.now(),
          demoMode,
        });
        setOffers(res.offers);
        setStatus("ready");
      }
    } catch (err) {
      if (myRequest !== requestId.current) return;
      const message = err instanceof Error ? err.message : "Unknown error";
      setOffers(mockOffers);
      setStatus("fallback");
      setErrorMessage(message);
    }
  }, [latitude, longitude, accuracy, demoMode, intentTags, pastCategories]);

  useEffect(() => {
    if (!enabled) return;
    void fetchOffers();
  }, [enabled, fetchOffers]);

  const acceptOffer = useCallback(
    async (id: string): Promise<Offer | null> => {
      const target = offers.find((o) => o.id === id);
      if (!target) return null;

      if (status === "fallback" || target.id.startsWith("off_mock_")) {
        const updated: Offer = {
          ...target,
          status: "accepted",
          redemption_token: "mock_token",
        };
        setOffers((curr) => curr.map((o) => (o.id === id ? updated : o)));
        return updated;
      }

      try {
        const res = await updateOffer(id, { action: "accept" });
        setOffers((curr) => curr.map((o) => (o.id === id ? res.offer : o)));
        return res.offer;
      } catch (err) {
        console.error("Accept offer failed", err);
        return null;
      }
    },
    [offers, status],
  );

  const dismissOffer = useCallback(
    async (id: string): Promise<void> => {
      const target = offers.find((o) => o.id === id);
      if (!target) return;

      setOffers((curr) => curr.filter((o) => o.id !== id));

      if (status === "fallback" || target.id.startsWith("off_mock_")) return;

      try {
        await updateOffer(id, { action: "dismiss" });
      } catch (err) {
        console.error("Dismiss offer failed", err);
      }
    },
    [offers, status],
  );

  return {
    offers,
    context,
    status,
    errorMessage,
    refresh: fetchOffers,
    acceptOffer,
    dismissOffer,
  };
}
