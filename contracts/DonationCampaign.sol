// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DonationCampaign
/// @notice Transparent, tamper-resistant record of donations for a single FireGuard
///         campaign (e.g. emergency response, equipment, environmental recovery).
///         Funds are held in the contract and released only by the campaign owner
///         (in production this should be a multisig or DAO-controlled address),
///         with every donation and withdrawal permanently recorded on-chain.
contract DonationCampaign {
    address public owner;
    string public campaignName;
    uint256 public goal; // wei
    uint256 public totalDonated;
    uint256 public totalWithdrawn;
    bool public closed;

    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    Donation[] public donations;

    event DonationReceived(address indexed donor, uint256 amount, uint256 timestamp);
    event FundsWithdrawn(address indexed to, uint256 amount, string reason);
    event CampaignClosed();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only campaign owner");
        _;
    }

    constructor(string memory _campaignName, uint256 _goal) {
        owner = msg.sender;
        campaignName = _campaignName;
        goal = _goal;
    }

    /// @notice Donate ETH to this campaign. Every donation is recorded individually
    ///         so the full history can be audited by anyone.
    function donate() external payable {
        require(!closed, "Campaign is closed");
        require(msg.value > 0, "Donation must be greater than 0");

        donations.push(Donation(msg.sender, msg.value, block.timestamp));
        totalDonated += msg.value;

        emit DonationReceived(msg.sender, msg.value, block.timestamp);
    }

    /// @notice Withdraw allocated funds to a recipient (e.g. emergency service,
    ///         supplier, NGO), with a human-readable reason recorded on-chain
    ///         for transparency.
    function withdraw(address payable to, uint256 amount, string calldata reason) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        totalWithdrawn += amount;
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Transfer failed");
        emit FundsWithdrawn(to, amount, reason);
    }

    function closeCampaign() external onlyOwner {
        closed = true;
        emit CampaignClosed();
    }

    function donationCount() external view returns (uint256) {
        return donations.length;
    }

    function getDonation(uint256 index) external view returns (address donor, uint256 amount, uint256 timestamp) {
        Donation storage d = donations[index];
        return (d.donor, d.amount, d.timestamp);
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
}
