import { NextResponse } from "next/server";
import { syncDonations } from "@/lib/donationIndexer";
import { DONATION_CONTRACT_ADDRESS } from "@/lib/donationContract";

export async function POST() {
  if (!DONATION_CONTRACT_ADDRESS) {
    return NextResponse.json({ error: "NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS is not set" }, { status: 400 });
  }

  try {
    const result = await syncDonations(DONATION_CONTRACT_ADDRESS);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
