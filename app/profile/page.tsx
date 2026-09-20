"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import VerifiedBadge from "@/components/VerifiedBadge";
import RoleIcon from "@/components/RoleIcon";
import { SELF_SERVICE_ROLES } from "@/lib/roles";

type Status = "idle" | "loading" | "saving" | "loaded" | "error";

function isSelfServiceRole(role: string): role is (typeof SELF_SERVICE_ROLES)[number] {
  return (SELF_SERVICE_ROLES as readonly string[]).includes(role);
}

export default function ProfilePage() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [didIdentifier, setDidIdentifier] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "authenticated") loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  async function loadProfile() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error("Failed to load profile");
      const user = await res.json();
      setEmail(user.email);
      setName(user.name);
      setRole(user.role);
      setDidIdentifier(user.didIdentifier ?? "");
      setStatus("loaded");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const body: Record<string, string> = { name, didIdentifier };
      if (isSelfServiceRole(role)) body.role = role;

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(JSON.stringify(data.error ?? "Failed to save profile"));
      }
      const updated = await res.json();
      setRole(updated.role);
      // Push the fresh role into the JWT/session immediately (via the jwt
      // callback's "update" trigger in lib/auth.ts) so the nav bar reflects
      // it right away instead of requiring a logout/login.
      await updateSession({ role: updated.role });
      setStatus("loaded");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  }

  if (sessionStatus === "loading") {
    return <p style={{ color: "var(--smoke)" }}>Loading...</p>;
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1>My Profile</h1>
        <p style={{ color: "var(--smoke)" }}>
          You need to be logged in to view or edit your profile.{" "}
          <Link href="/login">Log in</Link> or <Link href="/register">create an account</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1>My Profile</h1>
      <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
        Add your Decentralized Identifier (DID) below to show a "Verified" badge next to your name
        across the app.
      </p>

      <form onSubmit={handleSave} style={{ marginTop: 16 }}>
        <label>
          Email
          <input value={email} disabled />
        </label>
        {isSelfServiceRole(role) ? (
          <label>
            <RoleIcon role={role} /> Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {SELF_SERVICE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            <RoleIcon role={role} /> Role
            <input value={role} disabled />
            <span style={{ fontSize: "0.8rem", color: "var(--smoke)" }}>
              Elevated role — contact an administrator to change it.
            </span>
          </label>
        )}
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
        <button className="btn" type="submit" disabled={status === "saving" || status === "loading"}>
          {status === "saving" ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
