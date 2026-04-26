"use client";

import { Map, Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MerchantMiniMapProps {
  latitude: number;
  longitude: number;
  merchantName: string;
  emoji?: string;
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
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{ longitude, latitude, zoom: 16 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          scrollZoom={false}
          dragPan={false}
          dragRotate={false}
          doubleClickZoom={false}
          touchZoomRotate={false}
          attributionControl={false}
        >
          <Marker longitude={longitude} latitude={latitude} anchor="bottom">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#E30018",
                border: "3px solid white",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              {emoji || "📍"}
            </div>
          </Marker>
        </Map>
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
