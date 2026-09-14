import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const EmailQuery = z.object({ email: z.string().email() });

const ProfileUpdate = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  didIdentifier: z.string().max(200).optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = EmailQuery.safeParse({ email: searchParams.get("email") });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = ProfileUpdate.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, name, didIdentifier } = parsed.data;

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, didIdentifier: didIdentifier || null },
    create: { email, name, didIdentifier: didIdentifier || null },
  });

  return NextResponse.json(user);
}
