import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INCIDENT_STATUSES } from "@/lib/incidentEnums";
import { isAdmin } from "@/lib/roles";

const UpdateInput = z.object({
  status: z.enum(INCIDENT_STATUSES),
});

// This is the arbitrary status override used by the /admin dashboard's
// dropdown (components/AdminIncidentsTable.tsx) — distinct from the
// EMERGENCY_SERVICE/VALIDATOR high-trust confirmation flow in
// app/api/incidents/[id]/confirm/route.ts. Gated the same way /admin itself
// is: hiding the dropdown in the UI isn't enough, since this route can be
// called directly.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to update an incident" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Only admins can update incident status this way" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const incident = await prisma.incident.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json(incident);
}
