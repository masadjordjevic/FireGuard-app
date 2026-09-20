"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ActionSignupPanel({
  actionId,
  initiallySignedUp,
}: {
  actionId: string;
  initiallySignedUp: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [signedUp, setSignedUp] = useState(initiallySignedUp);
  const [showForm, setShowForm] = useState(false);
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") return null;

  if (!session) {
    return (
      <Link href="/login" style={{ fontSize: "0.85rem" }}>
        Log in to sign up
      </Link>
    );
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/volunteer-actions/${actionId}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Failed to sign up");
      }
      setSignedUp(true);
      setShowForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/volunteer-actions/${actionId}/signup`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Failed to leave");
      }
      setSignedUp(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (signedUp) {
    return (
      <div>
        <button className="btn" style={{ background: "var(--smoke)" }} onClick={handleLeave} disabled={loading}>
          {loading ? "Leaving..." : "Leave Action"}
        </button>
        {error && <p style={{ color: "crimson", fontSize: "0.8rem" }}>{error}</p>}
      </div>
    );
  }

  if (showForm) {
    return (
      <form onSubmit={handleJoin} style={{ marginTop: 10 }}>
        <label>
          Skills / availability (optional)
          <input value={skills} onChange={(e) => setSkills(e.target.value)} />
        </label>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button className="btn" disabled={loading} type="submit">
          {loading ? "Signing up..." : "Confirm signup"}
        </button>
      </form>
    );
  }

  return (
    <button className="btn" onClick={() => setShowForm(true)}>
      Sign up
    </button>
  );
}
