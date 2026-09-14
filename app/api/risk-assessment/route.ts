import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assessFireRisk } from "@/lib/riskAssessment";

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  if (!latParam || !lngParam) {
    return NextResponse.json({ error: "lat and lng query parameters are required" }, { status: 400 });
  }

  const parsed = Query.safeParse({ lat: latParam, lng: lngParam });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const assessment = await assessFireRisk(parsed.data.lat, parsed.data.lng);
    return NextResponse.json(assessment);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 502 });
  }
}
