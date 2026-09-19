import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const RegisterInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RegisterInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.password) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // A "shadow" account may already exist for this email from the anonymous
  // flows (reporting a fire, signing up to volunteer) that never registered.
  // Registering upgrades that record in place instead of creating a
  // duplicate — its existing role (e.g. VOLUNTEER) is preserved, only a
  // brand new record defaults to CITIZEN.
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: passwordHash },
    create: { name, email, password: passwordHash, role: "CITIZEN" },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
