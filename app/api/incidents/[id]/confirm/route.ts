import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const HIGH_TRUST_ROLES = ["EMERGENCY_SERVICE", "VALIDATOR"];
const HIGH_TRUST_LEVEL = 3; // above the default trustLevel of 1 for an ordinary confirmation

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to confirm an incident" }, { status: 401 });
  }

  // The confirming user's role always comes from their authenticated
  // session (resolved server-side from the DB via the JWT), never from
  // client input — a client-supplied role field was exactly the insecure
  // shortcut this endpoint replaces.
  if (!HIGH_TRUST_ROLES.includes(session.user.role)) {
    return NextResponse.json(
      { error: "Only Emergency Service or Validator accounts can issue a high-trust confirmation" },
      { status: 403 }
    );
  }

  const incident = await prisma.incident.findUnique({ where: { id: params.id } });
  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  const [confirmation, updatedIncident] = await prisma.$transaction([
    prisma.confirmation.create({
      data: { incidentId: params.id, userId: session.user.id, trustLevel: HIGH_TRUST_LEVEL },
    }),
    prisma.incident.update({
      where: { id: params.id },
      data: incident.status === "REPORTED" ? { status: "VERIFIED" as const } : {},
    }),
  ]);

  return NextResponse.json({ confirmation, incident: updatedIncident });
}
