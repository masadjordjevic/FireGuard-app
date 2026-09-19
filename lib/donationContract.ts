export const DONATION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS || "";

export const DONATION_ABI = [
  "function donate() external payable",
  "function totalDonated() view returns (uint256)",
  "function campaignName() view returns (string)",
  "function goal() view returns (uint256)",
  "event DonationReceived(address indexed donor, uint256 amount, uint256 timestamp)",
];
