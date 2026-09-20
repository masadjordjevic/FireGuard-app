"use client";

import { useEffect, useState } from "react";

type Assessment = {
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
  explanation: string;
};

// Debounce the lookup so typing coordinates digit-by-digit doesn't fire a
// weather API call on every keystroke.
const DEBOUNCE_MS = 600;

export default function RiskAssessmentBadge({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setAssessment(null);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/risk-assessment?lat=${latitude}&lng=${longitude}`);
        if (!res.ok) throw new Error("Failed to fetch risk assessment");
        setAssessment(await res.json());
      } catch {
        setAssessment(null);
        setError(true);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [latitude, longitude]);

  if (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  if (loading) {
    return <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>Checking fire risk for this location...</p>;
  }

  if (error) {
    return <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>Couldn't check fire risk for this location.</p>;
  }

  if (!assessment) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      <span className={`status-badge risk-${assessment.riskLevel}`}>Fire risk: {assessment.riskLevel}</span>
      <p style={{ fontSize: "0.85rem", color: "var(--smoke)", marginTop: 4 }}>{assessment.explanation}</p>
    </div>
  );
}
