"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { AlertTriangle } from "lucide-react";
import { DONATION_ABI } from "@/lib/donationContract";

export default function CampaignDonateForm({
  campaignId,
  contractAddress,
}: {
  campaignId: string;
  contractAddress: string | null;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState("0.01");
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDonate() {
    setStatus(null);
    setTxHash(null);

    if (!session) {
      setStatus("Log in first so this donation can be attributed to your account.");
      return;
    }
    if (!(window as any).ethereum) {
      setStatus("MetaMask not found. Install MetaMask to donate on the Sepolia testnet.");
      return;
    }
    if (!contractAddress) {
      setStatus("This campaign has no deployed contract yet.");
      return;
    }

    try {
      setLoading(true);
      const provider = new BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, DONATION_ABI, signer);

      const tx = await contract.donate({ value: parseEther(amount) });
      setStatus("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      const hash = receipt?.hash ?? tx.hash;
      setTxHash(hash);
      setStatus("Thank you! Your donation is confirmed on the Sepolia testnet.");

      try {
        const res = await fetch(`/api/campaigns/${campaignId}/donations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: hash }),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Failed to record donation:", data.error);
        }
      } catch {
        // Non-fatal — the on-chain indexer will pick it up on its next sync.
      }
      router.refresh();
    } catch (err: any) {
      setStatus(`Error: ${err.shortMessage || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!session && (
        <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
          <Link href="/login">Log in</Link> first so your donation is credited to your account in
          the history below.
        </p>
      )}
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
      {!contractAddress && (
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--smoke)",
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <AlertTriangle size={14} /> No contract deployed for this campaign yet.
        </p>
      )}
    </div>
  );
}
