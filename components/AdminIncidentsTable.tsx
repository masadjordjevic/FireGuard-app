"use client";

import { useState } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";

const STATUSES = ["REPORTED", "VERIFIED", "CONTAINED", "RESOLVED", "FALSE_ALARM"] as const;

type Incident = {
  id: string;
  title: string;
  status: string;
  latitude: number;
  longitude: number;
  reportedBy: { name: string; didIdentifier: string | null };
};

export default function AdminIncidentsTable({ incidents: initial }: { incidents: Incident[] }) {
  const [incidents, setIncidents] = useState(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setIncidents((prev) => prev.map((inc) => (inc.id === id ? { ...inc, status: updated.status } : inc)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Location</th>
            <th>Reported by</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => (
            <tr key={inc.id}>
              <td>{inc.title}</td>
              <td>
                {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
              </td>
              <td>
                {inc.reportedBy.name}
                <VerifiedBadge didIdentifier={inc.reportedBy.didIdentifier} />
              </td>
              <td>
                <span className={`status-badge status-${inc.status}`} style={{ marginRight: 8 }}>
                  {inc.status}
                </span>
                <select
                  value={inc.status}
                  disabled={savingId === inc.id}
                  onChange={(e) => updateStatus(inc.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {incidents.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: "var(--smoke)" }}>
                No incidents reported yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
