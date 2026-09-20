import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/publicUser";
import { assessFireRisk } from "@/lib/riskAssessment";
import VerifiedBadge from "@/components/VerifiedBadge";
import IncidentConfirmPanel from "@/components/IncidentConfirmPanel";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
  const incident = await prisma.incident.findUnique({
    where: { id: params.id },
    include: {
      reportedBy: { select: publicUserSelect },
      confirmations: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: publicUserSelect } },
      },
    },
  });

  if (!incident) notFound();

  const risk = await assessFireRisk(incident.latitude, incident.longitude).catch(() => null);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h1 style={{ marginTop: 0 }}>{incident.title}</h1>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span className={`status-badge status-${incident.status}`}>{incident.status}</span>
            <span className={`status-badge danger-${incident.dangerLevel}`}>Danger: {incident.dangerLevel}</span>
          </div>
        </div>

        {incident.photoUrl && (
          <img
            src={incident.photoUrl}
            alt={incident.title}
            style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 8, margin: "12px 0" }}
          />
        )}

        <p>{incident.description}</p>

        <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
          📍 {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
        </p>

        {risk && (
          <div style={{ marginBottom: 10 }}>
            <span className={`status-badge risk-${risk.riskLevel}`}>Current fire risk: {risk.riskLevel}</span>
            <p style={{ fontSize: "0.85rem", color: "var(--smoke)", marginTop: 4 }}>{risk.explanation}</p>
          </div>
        )}

        {incident.evidenceUrl && (
          <p style={{ fontSize: "0.85rem" }}>
            Evidence:{" "}
            <a href={incident.evidenceUrl} target="_blank" rel="noreferrer">
              {incident.evidenceUrl}
            </a>
          </p>
        )}

        <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
          Reported by {incident.reportedBy.name}
          <VerifiedBadge didIdentifier={incident.reportedBy.didIdentifier} /> on{" "}
          {new Date(incident.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="card">
        <h2>Confirm this incident</h2>
        <IncidentConfirmPanel incidentId={incident.id} />
      </div>

      <div className="card">
        <h2>Confirmations ({incident.confirmations.length})</h2>
        {incident.confirmations.length === 0 ? (
          <p style={{ color: "var(--smoke)" }}>No confirmations yet.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {incident.confirmations.map((c) => (
              <li key={c.id} style={{ marginBottom: 6 }}>
                <strong>{c.user.name}</strong>
                <VerifiedBadge didIdentifier={c.user.didIdentifier} />{" "}
                <span style={{ fontSize: "0.8rem", color: "var(--smoke)" }}>
                  ({c.user.role}, trust level {c.trustLevel}) — {new Date(c.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
