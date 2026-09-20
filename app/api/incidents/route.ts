import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/publicUser";
import { DANGER_LEVELS } from "@/lib/incidentEnums";

// ~6MB of base64 text, comfortably above a few-MB photo upload while still
// bounding the size of a single SQLite row.
const MAX_PHOTO_DATA_URI_LENGTH = 8_000_000;

const IncidentInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  latitude: z.number(),
  longitude: z.number(),
  evidenceUrl: z.string().url().optional().or(z.literal("")),
  photoUrl: z.string().max(MAX_PHOTO_DATA_URI_LENGTH).optional().or(z.literal("")),
  dangerLevel: z.enum(DANGER_LEVELS),
  reporterEmail: z.string().email(),
  reporterName: z.string().min(1),
});

export async function GET() {
  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: "desc" },
    include: { reportedBy: { select: publicUserSelect }, confirmations: true },
  });
  return NextResponse.json(incidents);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = IncidentInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { reporterEmail, reporterName, ...incidentData } = parsed.data;

  // Reuse an existing citizen account or create a lightweight one for this reporter
  const reporter = await prisma.user.upsert({
    where: { email: reporterEmail },
    update: {},
    create: { name: reporterName, email: reporterEmail, role: "CITIZEN" },
  });

  const incident = await prisma.incident.create({
    data: {
      ...incidentData,
      evidenceUrl: incidentData.evidenceUrl || null,
      photoUrl: incidentData.photoUrl || null,
      reportedById: reporter.id,
    },
  });

  return NextResponse.json(incident, { status: 201 });
}
