"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSyncDonationsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/donations/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setMessage(`Synced up to block ${data.toBlock} — ${data.newDonations} new donation(s).`);
      router.refresh();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button className="btn" style={{ padding: "4px 12px", fontSize: "0.85rem" }} onClick={handleSync} disabled={loading}>
        {loading ? "Syncing..." : "Sync from chain"}
      </button>
      {message && <span style={{ fontSize: "0.8rem", color: "var(--smoke)" }}>{message}</span>}
    </div>
  );
}
