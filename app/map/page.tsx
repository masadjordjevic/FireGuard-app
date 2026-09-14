import nextDynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";
import { assessFireRisk } from "@/lib/riskAssessment";

// Leaflet touches `window`, so the map must be loaded client-side only
const IncidentMap = nextDynamic(() => import("@/components/IncidentMap"), { ssr: false });

// Route segment config: always fetch fresh incidents, never statically cache this page
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: "desc" },
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
    </div>
  );
}
