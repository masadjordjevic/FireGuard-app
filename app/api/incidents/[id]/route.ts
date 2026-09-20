import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INCIDENT_STATUSES } from "@/lib/incidentEnums";

const UpdateInput = z.object({
  status: z.enum(INCIDENT_STATUSES),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
