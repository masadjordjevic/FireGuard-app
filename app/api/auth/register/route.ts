import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SELF_SERVICE_ROLES } from "@/lib/roles";

const RegisterInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(SELF_SERVICE_ROLES).default("CITIZEN"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = RegisterInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.password) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // A "shadow" account may already exist for this email from the anonymous
  // flows (reporting a fire, signing up to volunteer) that never registered —
  // those only ever get CITIZEN or VOLUNTEER. If an admin has since manually
  // elevated that email's role (e.g. to EMERGENCY_SERVICE via Prisma Studio,
  // ahead of that person registering), keep it: don't let the public
  // registration form's role picker silently downgrade it back down.
  const ANONYMOUS_DEFAULT_ROLES = ["CITIZEN", "VOLUNTEER"];
  const roleToApply = existing && !ANONYMOUS_DEFAULT_ROLES.includes(existing.role) ? existing.role : role;

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: passwordHash, role: roleToApply },
    create: { name, email, password: passwordHash, role },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
}
