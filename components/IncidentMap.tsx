"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import VerifiedBadge from "@/components/VerifiedBadge";

// Fix default marker icons (Next.js/webpack doesn't resolve Leaflet's default asset paths)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

type Incident = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  riskLevel?: RiskLevel;
  reportedBy?: { name: string; didIdentifier: string | null };
};

export default function IncidentMap({ incidents }: { incidents: Incident[] }) {
  const center: [number, number] =
    incidents.length > 0 ? [incidents[0].latitude, incidents[0].longitude] : [44.7866, 20.4489]; // default: Belgrade

  return (
    <MapContainer center={center} zoom={7} style={{ height: "500px", width: "100%", borderRadius: 12 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((inc) => (
        <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={icon}>
          <Popup>
            <strong>{inc.title}</strong>
            <br />
            <span className={`status-badge status-${inc.status}`}>{inc.status}</span>{" "}
            {inc.riskLevel && (
              <span className={`status-badge risk-${inc.riskLevel}`}>Risk: {inc.riskLevel}</span>
            )}
            <p style={{ marginTop: 6 }}>{inc.description}</p>
            {inc.reportedBy && (
              <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
                Reported by {inc.reportedBy.name}
                <VerifiedBadge didIdentifier={inc.reportedBy.didIdentifier} />
              </p>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
