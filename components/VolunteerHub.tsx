"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MapPin, Wrench } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import ActionSignupPanel from "@/components/ActionSignupPanel";

type Action = {
  id: string;
  title: string;
  description: string;
  location: string;
  neededSkills: string | null;
  createdBy: { name: string; emailVerified: boolean };
  signups: { id: string; userId: string }[];
};

export default function VolunteerHub() {
  const { data: session } = useSession();
  const [actions, setActions] = useState<Action[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch("/api/volunteer-actions");
    setActions(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Open Actions</h2>
        {session ? (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ New action"}
          </button>
        ) : (
          <Link href="/login" className="btn" style={{ textDecoration: "none" }}>
            Log in to create an action
          </Link>
        )}
      </div>

      {showForm && (
        <NewActionForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="grid" style={{ marginTop: 24 }}>
        {actions.map((a) => {
          const mine = session ? a.signups.some((s) => s.userId === session.user.id) : false;
          return (
            <div className="card" key={a.id}>
              <h3>
                <Link href={`/actions/${a.id}`} style={{ color: "inherit" }}>
                  {a.title}
                </Link>
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--smoke)" }}>{a.description}</p>
              <p style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={14} color="var(--ember)" /> {a.location}
              </p>
              {a.neededSkills && (
                <p style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 5 }}>
                  <Wrench size={14} color="var(--smoke)" /> {a.neededSkills}
                </p>
              )}
              <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
                {a.signups.length} volunteer(s) signed up · by {a.createdBy.name}
                <VerifiedBadge verified={a.createdBy.emailVerified} />
              </p>
              <ActionSignupPanel actionId={a.id} initiallySignedUp={mine} />
              <p style={{ marginTop: 8 }}>
                <Link href={`/actions/${a.id}`} style={{ fontSize: "0.85rem" }}>
                  View details →
                </Link>
              </p>
            </div>
          );
        })}
        {actions.length === 0 && <p style={{ color: "var(--smoke)" }}>No volunteer actions yet. Be the first to create one.</p>}
      </div>
    </div>
  );
}

function NewActionForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    neededSkills: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/volunteer-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Failed to create action");
      }
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={submit} style={{ marginTop: 16 }}>
      <label>
        Title
        <input required value={form.title} onChange={(e) => update("title", e.target.value)} />
      </label>
      <label>
        Description
        <textarea required rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </label>
      <label>
        Location
        <input required value={form.location} onChange={(e) => update("location", e.target.value)} />
      </label>
      <label>
        Needed skills (optional)
        <input value={form.neededSkills} onChange={(e) => update("neededSkills", e.target.value)} />
      </label>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button className="btn" disabled={loading} type="submit">
        {loading ? "Creating..." : "Create action"}
      </button>
    </form>
  );
}
