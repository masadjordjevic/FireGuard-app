import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/roles";
import { assessFireRisk } from "@/lib/riskAssessment";
import { analyzeIncident } from "@/lib/incidentAgent";

// Advisory-only: this never writes to the database. It returns a
// recommendation; applying it (if the human reviewer agrees) goes through
// the existing PATCH /api/incidents/[id] route, unchanged.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to request an AI analysis" }, { status: 401 });
  }
  if (!isElevatedRole(session.user.role)) {
    return NextResponse.json(
      { error: "Only Emergency Service, Validator, or Admin accounts can request an AI analysis" },
      { status: 403 }
    );
  }

  const incident = await prisma.incident.findUnique({
    where: { id: params.id },
    include: {
      reportedBy: { select: { emailVerified: true } },
      confirmations: { select: { trustLevel: true, user: { select: { role: true } } } },
    },
  });
  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  const risk = await assessFireRisk(incident.latitude, incident.longitude).catch(() => null);

  try {
    const recommendation = await analyzeIncident({
      title: incident.title,
      description: incident.description,
      status: incident.status,
      dangerLevel: incident.dangerLevel,
      latitude: incident.latitude,
      longitude: incident.longitude,
      reportedByVerified: incident.reportedBy.emailVerified,
      confirmations: incident.confirmations.map((c) => ({ role: c.user.role, trustLevel: c.trustLevel })),
      weather: risk?.weather ?? null,
      riskLevel: risk?.riskLevel ?? null,
    });
    return NextResponse.json(recommendation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
