"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const HIGH_TRUST_ROLES = ["EMERGENCY_SERVICE", "VALIDATOR"];

export default function IncidentConfirmPanel({ incidentId }: { incidentId: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (status === "loading") return null;

  if (!session || !HIGH_TRUST_ROLES.includes(session.user.role)) {
    return (
      <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
        Only Emergency Service or Validator accounts can issue an official high-trust confirmation.
      </p>
    );
  }

  return (
    <div>
      <button className="btn" onClick={handleConfirm} disabled={loading}>
        {loading ? "Confirming..." : "Confirm as verified"}
      </button>
      {error && <p style={{ color: "crimson", fontSize: "0.85rem", marginTop: 6 }}>{error}</p>}
    </div>
  );
}
