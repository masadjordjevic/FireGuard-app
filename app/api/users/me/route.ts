import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/publicUser";
import { SELF_SERVICE_ROLES } from "@/lib/roles";

const ProfileUpdate = z.object({
  name: z.string().min(1),
  role: z.enum(SELF_SERVICE_ROLES).optional(),
  didIdentifier: z.string().max(200).optional().or(z.literal("")),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: publicUserSelect,
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ProfileUpdate.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, role, didIdentifier } = parsed.data;

  const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!current) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only apply the submitted role if the account's current role is itself
  // self-service (CITIZEN/NGO) — an EMERGENCY_SERVICE/VALIDATOR/ADMIN account
  // editing their name or DID must never have that manually-granted role
  // silently overwritten by whatever the profile form happened to submit.
  const canSelfEditRole = (SELF_SERVICE_ROLES as readonly string[]).includes(current.role);
  const roleToApply = canSelfEditRole && role ? role : current.role;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, role: roleToApply, didIdentifier: didIdentifier || null },
    select: publicUserSelect,
  });

  return NextResponse.json(user);
}
