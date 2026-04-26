"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOCATION } from "@/lib/demo";

export type GeolocationStatus = "loading" | "ready" | "denied" | "error" | "unsupported";

export interface GeolocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  status: GeolocationStatus;
  isDefault: boolean;
}

export function useGeolocation(enabled: boolean): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
    accuracy: null,
    status: "loading",
    isDefault: true,
  });

  useEffect(() => {
    if (!enabled) {
      setState({
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude,
        accuracy: null,
        status: "denied",
        isDefault: true,
      });
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude,
        accuracy: null,
        status: "unsupported",
        isDefault: true,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          status: "ready",
          isDefault: false,
        });
      },
      (err) => {
        const status: GeolocationStatus =
          err.code === err.PERMISSION_DENIED ? "denied" : "error";
        setState({
          latitude: DEFAULT_LOCATION.latitude,
          longitude: DEFAULT_LOCATION.longitude,
          accuracy: null,
          status,
          isDefault: true,
        });
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    );
  }, [enabled]);

  return state;
}
