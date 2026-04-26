"use client";

import { useEffect, useMemo, useRef } from "react";
import { Map, Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Merchant, MerchantCategory } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MapViewProps {
  userLocation: { latitude: number; longitude: number };
  merchants: Merchant[];
  height: string | number;
  selectedMerchantId?: string | null;
  onMerchantClick?: (id: string) => void;
  initialZoom?: number;
  fitBounds?: boolean;
  mapStyle?: string;
}

const CATEGORY_COLOR: Record<MerchantCategory, string> = {
  cafe: "#8b5a3c",
  restaurant: "#d97706",
  bakery: "#c2410c",
  bar: "#7c3aed",
  bookstore: "#1f2937",
  retail: "#0891b2",
  grocery: "#15803d",
  fitness: "#be123c",
};

const CATEGORY_ICON: Record<MerchantCategory, string> = {
  cafe: "ph-coffee",
  restaurant: "ph-fork-knife",
  bakery: "ph-cookie",
  bar: "ph-wine",
  bookstore: "ph-book",
  retail: "ph-storefront",
  grocery: "ph-shopping-cart",
  fitness: "ph-barbell",
};

function MissingTokenPlaceholder({ height }: { height: string | number }) {
  const h = typeof height === "number" ? `${height}px` : height;
  return (
    <div
      className="flex w-full items-center justify-center border-y border-border-1 bg-sunken text-center"
      style={{ height: h }}
    >
      <div className="px-6">
        <i className="ph ph-map-trifold mb-2 text-2xl text-fg-3" />
        <p className="text-small font-semibold text-fg-2">Map unavailable</p>
        <p className="mt-1 text-micro text-fg-3">
          Set NEXT_PUBLIC_MAPBOX_TOKEN in frontend/.env.local
        </p>
      </div>
    </div>
  );
}

export default function MapView({
  userLocation,
  merchants,
  height,
  selectedMerchantId,
  onMerchantClick,
  initialZoom = 14,
  fitBounds = false,
  mapStyle = "mapbox://styles/mapbox/light-v11",
}: MapViewProps) {
  const mapRef = useRef<MapRef | null>(null);
  const heightCss = typeof height === "number" ? `${height}px` : height;

  const center = useMemo(() => ({
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
  }), [userLocation.latitude, userLocation.longitude]);

  useEffect(() => {
    if (!fitBounds || !mapRef.current || merchants.length === 0) return;
    const map = mapRef.current.getMap();
    const allPoints = [
      [userLocation.longitude, userLocation.latitude] as [number, number],
      ...merchants.map((m) => [m.longitude, m.latitude] as [number, number]),
    ];
    const lons = allPoints.map((p) => p[0]);
    const lats = allPoints.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 60, duration: 500, maxZoom: 14 },
    );
  }, [fitBounds, merchants, userLocation.latitude, userLocation.longitude]);

  useEffect(() => {
    if (!selectedMerchantId || !mapRef.current) return;
    const m = merchants.find((mm) => mm.id === selectedMerchantId);
    if (!m) return;
    mapRef.current.flyTo({ center: [m.longitude, m.latitude], zoom: 15.5, duration: 600 });
  }, [selectedMerchantId, merchants]);

  if (!MAPBOX_TOKEN) {
    return <MissingTokenPlaceholder height={height} />;
  }

  return (
    <div style={{ height: heightCss, width: "100%" }} className="relative overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ ...center, zoom: initialZoom }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <Marker latitude={userLocation.latitude} longitude={userLocation.longitude} anchor="center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 animate-ping rounded-pill bg-action-primary opacity-30" style={{ width: 24, height: 24, left: -2, top: -2 }} />
            <div
              className="rounded-pill border-[3px] border-white bg-action-primary shadow-lg"
              style={{ width: 20, height: 20 }}
            />
          </div>
        </Marker>

        {merchants.map((m) => {
          const isSelected = m.id === selectedMerchantId;
          const color = CATEGORY_COLOR[m.category] ?? "#374151";
          const icon = CATEGORY_ICON[m.category] ?? "ph-storefront";
          return (
            <Marker
              key={m.id}
              latitude={m.latitude}
              longitude={m.longitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onMerchantClick?.(m.id);
              }}
            >
              <button
                type="button"
                aria-label={m.name}
                className={`flex items-center justify-center rounded-pill border-2 border-white shadow-md transition-transform duration-150 hover:scale-110 ${
                  isSelected ? "scale-125" : ""
                }`}
                style={{
                  width: isSelected ? 36 : 28,
                  height: isSelected ? 36 : 28,
                  backgroundColor: color,
                }}
              >
                <i className={`ph ${icon} text-white`} style={{ fontSize: isSelected ? 18 : 14 }} />
              </button>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
