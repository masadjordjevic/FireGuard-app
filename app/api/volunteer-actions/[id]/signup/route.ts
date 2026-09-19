import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SignupInput = z.object({
  skills: z.string().optional(),
  available: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to sign up" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = SignupInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const signup = await prisma.volunteerSignup.create({
    data: { actionId: params.id, userId: session.user.id, ...parsed.data },
  });

  return NextResponse.json(signup, { status: 201 });
}
