import { ethers } from "ethers";
import { prisma } from "@/lib/prisma";
import { DONATION_ABI } from "@/lib/donationContract";

const BLOCK_CHUNK_SIZE = 2000;

export type SyncResult = {
  contractAddress: string;
  fromBlock: number;
  toBlock: number;
  newDonations: number;
};

// Reads DonationReceived events from the deployed DonationCampaign.sol
// contract and mirrors them into the Donation table, so pages can show
// campaign progress from a fast local query instead of hitting an RPC node
// on every page view. Safe to call repeatedly (e.g. from a cron job or after
// a donation): it resumes from DonationCampaign.lastSyncedBlock and skips
// any tx hash already recorded.
//
// Kept in sync manually with scripts/sync-donations.js, a standalone copy of
// this same logic for running as a plain `node` process (e.g. from a cron
// job) without booting the Next.js app.
export async function syncDonations(contractAddress: string, rpcUrl?: string): Promise<SyncResult> {
  const url = rpcUrl || process.env.SEPOLIA_RPC_URL;
  if (!url) throw new Error("SEPOLIA_RPC_URL is not set");
  if (!contractAddress) throw new Error("No contract address provided");

  const provider = new ethers.JsonRpcProvider(url);
  const contract = new ethers.Contract(contractAddress, DONATION_ABI, provider);

  let campaign = await prisma.donationCampaign.findFirst({ where: { contractAddress } });

  if (!campaign) {
    const deployBlockEnv = process.env.DONATION_CONTRACT_DEPLOY_BLOCK;
    if (!deployBlockEnv) {
      throw new Error(
        "No DonationCampaign found for this contract and DONATION_CONTRACT_DEPLOY_BLOCK is not set. " +
          "Set it to the block number printed by `npm run deploy:sepolia` so the indexer knows where to start scanning."
      );
    }

    const [name, goalWei] = await Promise.all([contract.campaignName(), contract.goal()]);

    campaign = await prisma.donationCampaign.create({
      data: {
        title: name,
        description: "Auto-created by the donation indexer from on-chain contract data.",
        goalEth: Number(ethers.formatEther(goalWei)),
        contractAddress,
        lastSyncedBlock: Number(deployBlockEnv) - 1,
      },
    });
  }

  const latestBlock = await provider.getBlockNumber();
  const fromBlock = (campaign.lastSyncedBlock ?? -1) + 1;

  if (fromBlock > latestBlock) {
    return { contractAddress, fromBlock, toBlock: latestBlock, newDonations: 0 };
  }

  const walletUsers = await prisma.user.findMany({
    where: { walletAddress: { not: null } },
    select: { id: true, walletAddress: true },
  });

  let newDonations = 0;
  let cursor = fromBlock;

  while (cursor <= latestBlock) {
    const chunkEnd = Math.min(cursor + BLOCK_CHUNK_SIZE - 1, latestBlock);
    const events = await contract.queryFilter(contract.filters.DonationReceived(), cursor, chunkEnd);

    for (const event of events) {
      if (!("args" in event) || !event.args) continue;
      const donor = event.args[0] as string;
      const amount = event.args[1] as bigint;

      const existing = await prisma.donation.findUnique({ where: { txHash: event.transactionHash } });
      if (existing) continue;

      const donorUser = walletUsers.find((u) => u.walletAddress?.toLowerCase() === donor.toLowerCase());

      await prisma.donation.create({
        data: {
          amountEth: Number(ethers.formatEther(amount)),
          txHash: event.transactionHash,
          campaignId: campaign.id,
          donorId: donorUser?.id ?? null,
        },
      });
      newDonations++;
    }

    cursor = chunkEnd + 1;
  }

  await prisma.donationCampaign.update({
    where: { id: campaign.id },
    data: { lastSyncedBlock: latestBlock },
  });

  return { contractAddress, fromBlock, toBlock: latestBlock, newDonations };
}
