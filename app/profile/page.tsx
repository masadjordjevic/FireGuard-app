"use client";

import { useEffect, useState } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";

const EMAIL_STORAGE_KEY = "fireguard_profile_email";

type Status = "idle" | "loading" | "saving" | "loaded" | "not-found" | "error";

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [didIdentifier, setDidIdentifier] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (saved) {
      setEmail(saved);
      loadProfile(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile(lookupEmail: string) {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(lookupEmail)}`);
      if (res.status === 404) {
        setName("");
        setDidIdentifier("");
        setStatus("not-found");
        return;
      }
      if (!res.ok) throw new Error("Failed to load profile");
      const user = await res.json();
      setName(user.name);
      setDidIdentifier(user.didIdentifier ?? "");
      setStatus("loaded");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (email) await loadProfile(email);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, didIdentifier }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(JSON.stringify(data.error ?? "Failed to save profile"));
      }
      localStorage.setItem(EMAIL_STORAGE_KEY, email);
      setStatus("loaded");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1>My Profile</h1>
      <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
        FireGuard has no login yet, so profiles are looked up by email. Add your Decentralized
        Identifier (DID) below to show a "Verified" badge next to your name across the app.
      </p>

      <form onSubmit={handleLookup} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <label style={{ flex: 1 }}>
          Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button className="btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Looking up..." : "Look up"}
        </button>
      </form>

      {status === "not-found" && (
        <p style={{ color: "var(--smoke)", fontSize: "0.85rem" }}>
          No profile found for this email yet — fill in the details below and save to create one.
        </p>
      )}

      <form onSubmit={handleSave} style={{ marginTop: 16 }}>
        <label>
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          DID identifier (optional)
          <input
            value={didIdentifier}
            onChange={(e) => setDidIdentifier(e.target.value)}
            placeholder="did:ethr:0x... or did:ens:yourname.eth"
          />
        </label>
        <p style={{ fontSize: "0.8rem", color: "var(--smoke)" }}>
          Status: {didIdentifier ? <VerifiedBadge didIdentifier={didIdentifier} /> : "Not verified"}
        </p>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button className="btn" type="submit" disabled={status === "saving" || !email}>
          {status === "saving" ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
