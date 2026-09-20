"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRouter } from "next/navigation";

// Fix default marker icons (Next.js/webpack doesn't resolve Leaflet's default asset paths)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "EXTREME" | "UNKNOWN";

type Incident = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: string;
  riskLevel?: RiskLevel;
};

// Fits the viewport to every incident's coordinates instead of a fixed
// center/zoom, so the map reads correctly whether incidents are clustered in
// one city or spread across multiple countries/regions.
function FitToIncidents({ incidents }: { incidents: Incident[] }) {
  const map = useMap();

  useEffect(() => {
    if (incidents.length === 0) return;
    const bounds = L.latLngBounds(incidents.map((inc) => [inc.latitude, inc.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
  }, [map, incidents]);

  return null;
}

export default function IncidentMap({ incidents }: { incidents: Incident[] }) {
  const router = useRouter();
  const center: [number, number] =
    incidents.length > 0 ? [incidents[0].latitude, incidents[0].longitude] : [44.7866, 20.4489]; // default: Belgrade

  return (
    <MapContainer center={center} zoom={7} style={{ height: "500px", width: "100%", borderRadius: 12 }}>
      <FitToIncidents incidents={incidents} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((inc) => (
        <Marker
          key={inc.id}
          position={[inc.latitude, inc.longitude]}
          icon={icon}
          eventHandlers={{ click: () => router.push(`/incidents/${inc.id}`) }}
        >
          <Tooltip>
            {inc.title} — {inc.status}
            {inc.riskLevel && ` — Risk: ${inc.riskLevel}`}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
