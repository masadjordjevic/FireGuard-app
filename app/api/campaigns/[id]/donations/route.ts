import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ethers } from "ethers";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DonationInput = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Invalid transaction hash"),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to record a donation" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = DonationInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { txHash } = parsed.data;

  const campaign = await prisma.donationCampaign.findUnique({ where: { id: params.id } });
  if (!campaign?.contractAddress) {
    return NextResponse.json({ error: "This campaign has no deployed contract" }, { status: 400 });
  }

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    return NextResponse.json({ error: "SEPOLIA_RPC_URL is not configured" }, { status: 500 });
  }

  // Don't trust the client's claimed amount — look the transaction up
  // on-chain and verify it actually paid this campaign's contract before
  // recording it, so the donation history below can't be padded with fake
  // entries by just POSTing an arbitrary tx hash.
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const [tx, receipt] = await Promise.all([
    provider.getTransaction(txHash),
    provider.getTransactionReceipt(txHash),
  ]);

  if (!tx || !receipt) {
    return NextResponse.json({ error: "Transaction not found — it may still be pending" }, { status: 404 });
  }
  if (receipt.status !== 1) {
    return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });
  }
  if (tx.to?.toLowerCase() !== campaign.contractAddress.toLowerCase()) {
    return NextResponse.json({ error: "Transaction was not sent to this campaign's contract" }, { status: 400 });
  }

  // Idempotent: if the background indexer (lib/donationIndexer.ts) already
  // picked this up via the DonationReceived event, don't create a duplicate.
  const donation = await prisma.donation.upsert({
    where: { txHash },
    update: {},
    create: {
      amountEth: Number(ethers.formatEther(tx.value)),
      txHash,
      campaignId: campaign.id,
      donorId: session.user.id,
    },
  });

  return NextResponse.json(donation, { status: 201 });
}
