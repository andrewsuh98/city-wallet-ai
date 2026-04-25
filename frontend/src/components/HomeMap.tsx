"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const COLUMBIA_CENTER: [number, number] = [40.8075, -73.9626];

interface MerchantPin {
  id: string;
  name: string;
  category: string;
  position: [number, number];
  description: string;
  emoji: string;
}

const NEARBY_MERCHANTS: MerchantPin[] = [
  {
    id: "cu_001",
    name: "Hungarian Pastry Shop",
    category: "cafe",
    position: [40.8038, -73.9630],
    description: "Beloved campus cafe since 1961",
    emoji: "☕",
  },
  {
    id: "cu_002",
    name: "Koronet Pizza",
    category: "restaurant",
    position: [40.8055, -73.9659],
    description: "Giant slices, student prices",
    emoji: "🍕",
  },
  {
    id: "cu_003",
    name: "Book Culture",
    category: "bookstore",
    position: [40.8063, -73.9651],
    description: "Independent bookstore on Broadway",
    emoji: "📚",
  },
  {
    id: "cu_004",
    name: "Absolute Bagels",
    category: "bakery",
    position: [40.8029, -73.9671],
    description: "Hand-rolled, kettle-boiled bagels",
    emoji: "🥯",
  },
  {
    id: "cu_005",
    name: "Jin Ramen",
    category: "restaurant",
    position: [40.8047, -73.9665],
    description: "Rich tonkotsu ramen on Broadway",
    emoji: "🍜",
  },
  {
    id: "cu_006",
    name: "Junzi Kitchen",
    category: "restaurant",
    position: [40.8069, -73.9643],
    description: "Northern Chinese wraps and noodles",
    emoji: "🥟",
  },
  {
    id: "cu_007",
    name: "Milano Market",
    category: "grocery",
    position: [40.8081, -73.9616],
    description: "Classic deli and sandwiches near campus",
    emoji: "🥪",
  },
  {
    id: "cu_008",
    name: "Shake Shack Morningside",
    category: "restaurant",
    position: [40.8035, -73.9580],
    description: "Burgers at the edge of Morningside Park",
    emoji: "🍔",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  cafe: "#92400E",
  restaurant: "#1E3A8A",
  bookstore: "#1a1a2e",
  bakery: "#D97706",
  grocery: "#065F46",
};

function merchantIcon(merchant: MerchantPin) {
  return L.divIcon({
    className: "",
    html: `
      <div class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white text-base shadow-2" style="background-color: ${CATEGORY_COLORS[merchant.category] || "#3d3830"}">
        <span class="leading-none">${merchant.emoji}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

const columbiaIcon = L.divIcon({
  className: "",
  html: `
    <div class="flex flex-col items-center">
      <div class="whitespace-nowrap rounded-radius-2 bg-cw-paper-900 px-2 py-0.5 text-micro font-semibold text-fg-on-dark shadow-2">
        Columbia University
      </div>
      <div class="h-2 w-0.5 bg-cw-paper-900"></div>
    </div>
  `,
  iconSize: [132, 28],
  iconAnchor: [66, 28],
});

export default function HomeMap() {
  return (
    <MapContainer
      center={COLUMBIA_CENTER}
      zoom={15}
      scrollWheelZoom={false}
      zoomControl={false}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="topright" />

      {NEARBY_MERCHANTS.map((m) => (
        <Marker key={m.id} position={m.position} icon={merchantIcon(m)}>
          <Popup className="[&_.leaflet-popup-content-wrapper]:rounded-radius-3 [&_.leaflet-popup-content-wrapper]:border [&_.leaflet-popup-content-wrapper]:border-border-1 [&_.leaflet-popup-content-wrapper]:shadow-3 [&_.leaflet-popup-content]:m-0">
            <div className="min-w-[160px] p-3">
              <div className="text-small font-semibold text-fg-1">{m.name}</div>
              <div className="mt-0.5 text-micro text-fg-3">{m.description}</div>
              <div
                className="mt-1.5 inline-block rounded-radius-pill px-2 py-0.5 text-micro font-medium text-white"
                style={{ backgroundColor: CATEGORY_COLORS[m.category] || "#3d3830" }}
              >
                {m.category}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      <Marker position={COLUMBIA_CENTER} icon={columbiaIcon}>
        <Popup>Columbia University</Popup>
      </Marker>
    </MapContainer>
  );
}
