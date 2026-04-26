export type DemoMode = "rainy_afternoon" | "hot_weekend" | "event_night";

const VALID_DEMO_MODES = new Set<DemoMode>([
  "rainy_afternoon",
  "hot_weekend",
  "event_night",
]);

export function getDemoModeFromUrl(): DemoMode | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const value = params.get("demo");
  if (!value) return null;
  return VALID_DEMO_MODES.has(value as DemoMode) ? (value as DemoMode) : null;
}

export const DEFAULT_LOCATION = {
  latitude: 40.8075,
  longitude: -73.9626,
  label: "Columbia University",
};
