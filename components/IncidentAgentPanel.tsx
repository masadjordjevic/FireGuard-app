"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { isAdmin, isElevatedRole } from "@/lib/roles";

type Recommendation = {
  recommendedStatus: string;
  recommendedDangerLevel: string;
  confidence: string;
  rationale: string;
  suggestedActions: string[];
};

export default function IncidentAgentPanel({
  incidentId,
  currentStatus,
}: {
  incidentId: string;
  currentStatus: string;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  if (sessionStatus === "loading") return null;

  if (!session || !isElevatedRole(session.user.role)) {
    return (
      <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
        Only Emergency Service, Validator, or Admin accounts can request an AI triage recommendation.
      </p>
    );
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to analyze incident");
      setRecommendation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyStatus() {
    if (!recommendation) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: recommendation.recommendedStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to apply status");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <button
        className="btn"
        onClick={handleAnalyze}
        disabled={loading}
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Sparkles size={15} />
        {loading ? "Analyzing..." : recommendation ? "Re-analyze" : "Analyze with AI"}
      </button>
      {error && <p style={{ color: "crimson", fontSize: "0.85rem", marginTop: 8 }}>{error}</p>}
      {recommendation && (
        <div style={{ marginTop: 12, padding: 12, background: "var(--bg)", borderRadius: 8 }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
            Recommendation: {recommendation.recommendedStatus} · Danger: {recommendation.recommendedDangerLevel} ·
            Confidence: {recommendation.confidence}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>{recommendation.rationale}</p>
          {recommendation.suggestedActions.length > 0 && (
            <ul style={{ fontSize: "0.85rem", paddingLeft: 18, marginTop: 6 }}>
              {recommendation.suggestedActions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          )}
          <p style={{ fontSize: "0.75rem", color: "var(--smoke)", marginTop: 8 }}>
            AI-generated suggestion — no change has been applied yet.
          </p>
          {isAdmin(session.user.role) && recommendation.recommendedStatus !== currentStatus && (
            <button className="btn" onClick={handleApplyStatus} disabled={applying} style={{ marginTop: 8 }}>
              {applying ? "Applying..." : `Apply status: ${recommendation.recommendedStatus}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
