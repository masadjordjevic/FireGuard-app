const hre = require("hardhat");

async function main() {
  const campaignName = process.env.CAMPAIGN_NAME || "FireGuard Emergency Response Fund";
  const goalEth = process.env.CAMPAIGN_GOAL_ETH || "1"; // goal in ETH

  const DonationCampaign = await hre.ethers.getContractFactory("DonationCampaign");
  const goalWei = hre.ethers.parseEther(goalEth);

  const contract = await DonationCampaign.deploy(campaignName, goalWei);
  await contract.waitForDeployment();
  const receipt = await contract.deploymentTransaction().wait();

  console.log(`DonationCampaign "${campaignName}" deployed to:`, await contract.getAddress());
  console.log("Goal:", goalEth, "ETH");
  console.log("Deployed in block:", receipt.blockNumber);
  console.log("\nSet these in .env so the frontend and donation indexer can find the contract:");
  console.log(`  NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS="${await contract.getAddress()}"`);
  console.log(`  DONATION_CONTRACT_DEPLOY_BLOCK="${receipt.blockNumber}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
