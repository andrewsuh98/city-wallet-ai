"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MerchantMiniMapProps {
  latitude: number;
  longitude: number;
  merchantName: string;
  emoji?: string;
}

const CATEGORY_PIN_COLOR = "#E30018";

function pinIcon(emoji?: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:${CATEGORY_PIN_COLOR};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2)">
        <span style="font-size:16px;line-height:1">${emoji || "📍"}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function getDirectionsUrl(lat: number, lng: number, name: string): string {
  const encoded = encodeURIComponent(name);
  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isIOS) {
    return `maps://maps.apple.com/?daddr=${lat},${lng}&q=${encoded}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encoded}`;
}

export default function MerchantMiniMap({ latitude, longitude, merchantName, emoji }: MerchantMiniMapProps) {
  return (
    <div className="overflow-hidden rounded-3 border border-border-1 shadow-1">
      <div className="h-[160px] w-full">
        <MapContainer
          center={[latitude, longitude]}
          zoom={16}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          doubleClickZoom={false}
          touchZoom={false}
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[latitude, longitude]} icon={pinIcon(emoji)} />
        </MapContainer>
      </div>
      <a
        href={getDirectionsUrl(latitude, longitude, merchantName)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 border-t border-border-1 bg-card px-4 py-3 text-small font-semibold text-fg-link transition-colors hover:bg-cw-paper-50"
      >
        <i className="ph ph-navigation-arrow text-base" />
        Get directions to {merchantName}
      </a>
    </div>
  );
}
