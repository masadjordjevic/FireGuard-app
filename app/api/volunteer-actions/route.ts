import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ActionInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  neededSkills: z.string().optional(),
  startsAt: z.string().optional(), // ISO date string
  creatorName: z.string().min(1),
  creatorEmail: z.string().email(),
});

export async function GET() {
  const actions = await prisma.volunteerAction.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: true, signups: true },
  });
  return NextResponse.json(actions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ActionInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { creatorName, creatorEmail, startsAt, ...data } = parsed.data;

  const creator = await prisma.user.upsert({
    where: { email: creatorEmail },
    update: {},
    create: { name: creatorName, email: creatorEmail, role: "VOLUNTEER" },
  });

  const action = await prisma.volunteerAction.create({
    data: {
      ...data,
      startsAt: startsAt ? new Date(startsAt) : null,
      createdById: creator.id,
    },
  });

  return NextResponse.json(action, { status: 201 });
}
