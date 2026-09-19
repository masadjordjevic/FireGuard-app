"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import VerifiedBadge from "@/components/VerifiedBadge";

const HIGH_TRUST_ROLES = ["EMERGENCY_SERVICE", "VALIDATOR"];

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
            <ConfirmButton incidentId={inc.id} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function ConfirmButton({ incidentId }: { incidentId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !HIGH_TRUST_ROLES.includes(session.user.role)) return null;

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/confirm`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to confirm incident");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        className="btn"
        style={{ padding: "4px 10px", fontSize: "0.8rem" }}
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? "Confirming..." : "Confirm as verified"}
      </button>
      {error && <p style={{ color: "crimson", fontSize: "0.8rem" }}>{error}</p>}
    </div>
  );
}
