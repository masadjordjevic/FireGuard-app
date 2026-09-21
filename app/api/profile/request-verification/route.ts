import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { verificationRequestedAt: new Date() },
    select: { verificationRequestedAt: true },
  });

  return NextResponse.json(user);
}
