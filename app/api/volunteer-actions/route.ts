import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/publicUser";

const ActionInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  neededSkills: z.string().optional(),
  startsAt: z.string().optional(), // ISO date string
});

export async function GET() {
  const actions = await prisma.volunteerAction.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: publicUserSelect }, signups: true },
  });
  return NextResponse.json(actions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to create a volunteer action" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ActionInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { startsAt, ...data } = parsed.data;

  const action = await prisma.volunteerAction.create({
    data: {
      ...data,
      startsAt: startsAt ? new Date(startsAt) : null,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(action, { status: 201 });
}
