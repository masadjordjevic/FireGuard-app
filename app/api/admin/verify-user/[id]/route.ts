import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";

const VerifyInput = z.object({
  approved: z.boolean(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Only admins can approve or reject verification requests" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = VerifyInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: parsed.data.approved
      ? { emailVerified: true }
      : { verificationRequestedAt: null }, // rejected — user can request again
    select: { id: true, emailVerified: true, verificationRequestedAt: true },
  });

  return NextResponse.json(user);
}
