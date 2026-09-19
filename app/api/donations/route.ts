import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DONATION_CONTRACT_ADDRESS } from "@/lib/donationContract";

// On-chain-derived campaign progress for the /donate page — sourced from the
// Donation table, which lib/donationIndexer.ts / scripts/sync-donations.js
// keep populated from DonationReceived events, not from any local write.
export async function GET() {
  const campaign = await prisma.donationCampaign.findFirst({
    where: DONATION_CONTRACT_ADDRESS ? { contractAddress: DONATION_CONTRACT_ADDRESS } : undefined,
    orderBy: { createdAt: "desc" },
  });

  if (!campaign) {
    return NextResponse.json({ campaign: null, totalEth: 0, donationCount: 0, donations: [] });
  }

  const [aggregate, recentDonations] = await Promise.all([
    prisma.donation.aggregate({
      where: { campaignId: campaign.id },
      _sum: { amountEth: true },
      _count: true,
    }),
    prisma.donation.findMany({
      where: { campaignId: campaign.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { donor: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    campaign: { title: campaign.title, goalEth: campaign.goalEth, contractAddress: campaign.contractAddress },
    totalEth: aggregate._sum.amountEth ?? 0,
    donationCount: aggregate._count,
    donations: recentDonations.map((d) => ({
      amountEth: d.amountEth,
      txHash: d.txHash,
      createdAt: d.createdAt,
      donorName: d.donor?.name ?? null,
    })),
  });
}
