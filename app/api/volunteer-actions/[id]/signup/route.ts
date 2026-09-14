import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SignupInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  skills: z.string().optional(),
  available: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = SignupInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, skills, available } = parsed.data;

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, role: "VOLUNTEER" },
  });

  const signup = await prisma.volunteerSignup.create({
    data: { actionId: params.id, userId: user.id, skills, available },
  });

  return NextResponse.json(signup, { status: 201 });
}
