"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { DONATION_ABI, DONATION_CONTRACT_ADDRESS } from "@/lib/donationContract";

type Progress = {
  campaign: { title: string; goalEth: number; contractAddress: string | null } | null;
  totalEth: number;
  donationCount: number;
  donations: { amountEth: number; txHash: string; createdAt: string; donorName: string | null }[];
};

export default function DonatePage() {
  const [amount, setAmount] = useState("0.01");
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);

  async function loadProgress() {
    const res = await fetch("/api/donations");
    setProgress(await res.json());
  }

  useEffect(() => {
    loadProgress();
  }, []);

  async function handleDonate() {
    setStatus(null);
    setTxHash(null);

    if (!(window as any).ethereum) {
      setStatus("MetaMask nije pronađen. Instaliraj MetaMask da bi donirao na Sepolia testnet.");
      return;
    }
    if (!DONATION_CONTRACT_ADDRESS) {
      setStatus("Ugovor još nije deploy-ovan. Postavi NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS u .env nakon deploy-a (npm run deploy:sepolia).");
      return;
    }

    try {
      setLoading(true);
      const provider = new BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new Contract(DONATION_CONTRACT_ADDRESS, DONATION_ABI, signer);

      const tx = await contract.donate({ value: parseEther(amount) });
      setStatus("Transakcija poslata, čeka se potvrda...");
      const receipt = await tx.wait();
      setTxHash(receipt?.hash ?? tx.hash);
      setStatus("Hvala! Donacija je potvrđena na Sepolia testnetu.");

      // Pull the new DonationReceived event into our DB right away so the
      // progress below reflects it without waiting for the next scheduled sync.
      try {
        await fetch("/api/donations/sync", { method: "POST" });
      } catch {
        // Non-fatal — a scheduled/manual sync will pick it up later.
      }
      await loadProgress();
    } catch (err: any) {
      setStatus(`Greška: ${err.shortMessage || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const goalEth = progress?.campaign?.goalEth ?? 0;
  const totalEth = progress?.totalEth ?? 0;
  const pct = goalEth > 0 ? Math.min(100, Math.round((totalEth / goalEth) * 100)) : 0;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card">
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
        {!DONATION_CONTRACT_ADDRESS && (
          <p style={{ fontSize: "0.8rem", color: "var(--smoke)", marginTop: 14 }}>
            ⚠️ Contract not yet deployed — see README for deploy instructions.
          </p>
        )}
      </div>

      <div className="card">
        <h2>Campaign Progress</h2>
        {!progress?.campaign ? (
          <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
            No on-chain donations indexed yet — this fills in once the deployed contract has
            received its first donation and the indexer has synced (see README).
          </p>
        ) : (
          <>
            <p style={{ fontWeight: 600 }}>{progress.campaign.title}</p>
            <div
              style={{
                background: "var(--border)",
                borderRadius: 999,
                height: 10,
                overflow: "hidden",
                margin: "8px 0",
              }}
            >
              <div style={{ background: "var(--ember)", width: `${pct}%`, height: "100%" }} />
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
              {totalEth.toFixed(4)} / {goalEth} ETH raised ({pct}%) · {progress.donationCount} donation(s)
            </p>
            {progress.donations.length > 0 && (
              <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: "0.85rem" }}>
                {progress.donations.map((d) => (
                  <li key={d.txHash}>
                    {d.amountEth} ETH by {d.donorName ?? "anonymous wallet"} —{" "}
                    <a href={`https://sepolia.etherscan.io/tx/${d.txHash}`} target="_blank" rel="noreferrer">
                      tx
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
