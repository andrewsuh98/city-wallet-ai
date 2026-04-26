"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateOffers, getContext, updateOffer } from "@/lib/api";
import type { ContextState, Offer } from "@/lib/types";
import { getSessionId } from "@/lib/session";
import { DEFAULT_LOCATION, type DemoMode } from "@/lib/demo";

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
  const { enabled, latitude, longitude, accuracy, demoMode, intentTags, pastCategories } = input;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [context, setContext] = useState<ContextState | null>(null);
  const [status, setStatus] = useState<OffersStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchOffers = useCallback(async () => {
    const sid = getSessionId();
    if (!sid) return;

    const myRequest = ++requestId.current;
    setStatus("loading");
    setErrorMessage(null);
    setOffers([]);

    try {
      const loc = demoMode
        ? { latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude, accuracy_meters: undefined }
        : { latitude, longitude, accuracy_meters: accuracy ?? undefined };
      const ctx = await getContext(loc, demoMode);
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
        setOffers([]);
        setStatus("ready");
        setErrorMessage("No offers available for the current context.");
      } else {
        setOffers(res.offers);
        setStatus("ready");
      }
    } catch (err) {
      if (myRequest !== requestId.current) return;
      const message = err instanceof Error ? err.message : "Unknown error";
      setOffers([]);
      setStatus("error");
      setErrorMessage(message);
    }
  }, [latitude, longitude, accuracy, demoMode, intentTags, pastCategories]);

  useEffect(() => {
    if (!enabled) return;
    void fetchOffers();
  }, [enabled, fetchOffers]);

  const acceptOffer = useCallback(async (id: string): Promise<Offer | null> => {
    const target = offers.find((o) => o.id === id);
    if (!target) return null;

    try {
      const res = await updateOffer(id, { action: "accept" });
      setOffers((curr) => curr.map((o) => (o.id === id ? res.offer : o)));
      return res.offer;
    } catch (err) {
      console.error("Accept offer failed", err);
      return null;
    }
  }, [offers]);

  const dismissOffer = useCallback(async (id: string): Promise<void> => {
    const target = offers.find((o) => o.id === id);
    if (!target) return;

    setOffers((curr) => curr.filter((o) => o.id !== id));

    try {
      await updateOffer(id, { action: "dismiss" });
    } catch (err) {
      console.error("Dismiss offer failed", err);
    }
  }, [offers]);

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
