require("dotenv").config();
const { ethers } = require("ethers");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const BLOCK_CHUNK_SIZE = 2000;

const DONATION_ABI = [
  "function campaignName() view returns (string)",
  "function goal() view returns (uint256)",
  "event DonationReceived(address indexed donor, uint256 amount, uint256 timestamp)",
];

// Standalone copy of lib/donationIndexer.ts's syncDonations(), so this can
// run as a plain `node` process (e.g. from a cron job / scheduled task)
// without booting the Next.js app. Keep the two in sync manually if the
// indexing logic changes.
async function syncDonations(contractAddress, rpcUrl) {
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
          "Set it to the block number printed by `npm run deploy:sepolia`."
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
      if (!event.args) continue;
      const donor = event.args[0];
      const amount = event.args[1];

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

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS is not set");
  }
  const result = await syncDonations(contractAddress);
  console.log("Synced donations:", result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
