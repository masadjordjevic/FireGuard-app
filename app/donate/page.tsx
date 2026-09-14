"use client";

import { useState } from "react";
import { BrowserProvider, Contract, parseEther } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS || "";

const ABI = [
  "function donate() external payable",
  "function totalDonated() view returns (uint256)",
  "function campaignName() view returns (string)",
  "function goal() view returns (uint256)",
];

export default function DonatePage() {
  const [amount, setAmount] = useState("0.01");
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDonate() {
    setStatus(null);
    setTxHash(null);

    if (!(window as any).ethereum) {
      setStatus("MetaMask nije pronađen. Instaliraj MetaMask da bi donirao na Sepolia testnet.");
      return;
    }
    if (!CONTRACT_ADDRESS) {
      setStatus("Ugovor još nije deploy-ovan. Postavi NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS u .env nakon deploy-a (npm run deploy:sepolia).");
      return;
    }

    try {
      setLoading(true);
      const provider = new BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.donate({ value: parseEther(amount) });
      setStatus("Transakcija poslata, čeka se potvrda...");
      const receipt = await tx.wait();
      setTxHash(receipt?.hash ?? tx.hash);
      setStatus("Hvala! Donacija je potvrđena na Sepolia testnetu.");
    } catch (err: any) {
      setStatus(`Greška: ${err.shortMessage || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1>Donate</h1>
      <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
        Donations go directly to a transparent smart contract on the Sepolia testnet. Every
        donation is permanently recorded and auditable on-chain.
      </p>
      <label>
        Amount (ETH, Sepolia testnet)
        <input type="number" step="0.001" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <button className="btn" onClick={handleDonate} disabled={loading}>
        {loading ? "Processing..." : "Connect wallet & donate"}
      </button>
      {status && <p style={{ marginTop: 14 }}>{status}</p>}
      {txHash && (
        <p style={{ fontSize: "0.85rem" }}>
          Tx:{" "}
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
            {txHash}
          </a>
        </p>
      )}
      {!CONTRACT_ADDRESS && (
        <p style={{ fontSize: "0.8rem", color: "var(--smoke)", marginTop: 14 }}>
          ⚠️ Contract not yet deployed — see README for deploy instructions.
        </p>
      )}
    </div>
  );
}
