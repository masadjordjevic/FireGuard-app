import nextDynamic from "next/dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { assessFireRisk } from "@/lib/riskAssessment";
import { publicUserSelect } from "@/lib/publicUser";
import VerifiedBadge from "@/components/VerifiedBadge";
import StatusBadge from "@/components/StatusBadge";

// Leaflet touches `window`, so the map must be loaded client-side only
const IncidentMap = nextDynamic(() => import("@/components/IncidentMap"), { ssr: false });

// Route segment config: always fetch fresh incidents, never statically cache this page
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: "desc" },
    include: { reportedBy: { select: publicUserSelect } },
  });

  // Fire risk depends on current weather at each incident's location, so it's
  // computed per-incident rather than cached alongside the incident record.
  const incidentsWithRisk = await Promise.all(
    incidents.map(async (incident) => {
      try {
        const { riskLevel } = await assessFireRisk(incident.latitude, incident.longitude);
        return { ...incident, riskLevel };
      } catch {
        return { ...incident, riskLevel: "UNKNOWN" as const };
      }
    })
  );

  return (
    <div>
      <h1>Active Incidents</h1>
      <p style={{ color: "var(--smoke)" }}>{incidents.length} reported incident(s).</p>
      <div className="card">
        <IncidentMap incidents={incidentsWithRisk} />
      </div>

      <div className="grid">
        {incidentsWithRisk.map((inc) => (
          <Link
            key={inc.id}
            href={`/incidents/${inc.id}`}
            className={`card card-accent-${inc.dangerLevel}`}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            {inc.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={inc.photoUrl}
                alt=""
                style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 10 }}
              />
            )}
            <h3 style={{ marginTop: 0 }}>{inc.title}</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              <StatusBadge status={inc.status} />
              <span className={`status-badge danger-${inc.dangerLevel}`}>Danger: {inc.dangerLevel}</span>
              {inc.riskLevel && <span className={`status-badge risk-${inc.riskLevel}`}>Risk: {inc.riskLevel}</span>}
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--smoke)" }}>{inc.description}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
              Reported by {inc.reportedBy.name}
              <VerifiedBadge verified={inc.reportedBy.emailVerified} />
            </p>
          </Link>
        ))}
        {incidentsWithRisk.length === 0 && (
          <p className="empty-state">
            No incidents reported yet — be the first to report a fire in your area.
          </p>
        )}
      </div>
    </div>
  );
}
