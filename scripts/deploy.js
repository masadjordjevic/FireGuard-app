const hre = require("hardhat");

async function main() {
  const campaignName = process.env.CAMPAIGN_NAME || "FireGuard Emergency Response Fund";
  const goalEth = process.env.CAMPAIGN_GOAL_ETH || "1"; // goal in ETH

  const DonationCampaign = await hre.ethers.getContractFactory("DonationCampaign");
  const goalWei = hre.ethers.parseEther(goalEth);

  const contract = await DonationCampaign.deploy(campaignName, goalWei);
  await contract.waitForDeployment();

  console.log(`DonationCampaign "${campaignName}" deployed to:`, await contract.getAddress());
  console.log("Goal:", goalEth, "ETH");
  console.log("\nSave this address into DonationCampaign.contractAddress in your database,");
  console.log("or set NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS in .env for the frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
