"use client";

import { useEffect, useState } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";

type Action = {
  id: string;
  title: string;
  description: string;
  location: string;
  neededSkills: string | null;
  createdBy: { name: string; didIdentifier: string | null };
  signups: { id: string }[];
};

export default function VolunteerHub() {
  const [actions, setActions] = useState<Action[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [signupFor, setSignupFor] = useState<string | null>(null);

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
        <h1>Volunteer Hub</h1>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New action"}
        </button>
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
        {actions.map((a) => (
          <div className="card" key={a.id}>
            <h3>{a.title}</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--smoke)" }}>{a.description}</p>
            <p style={{ fontSize: "0.85rem" }}>📍 {a.location}</p>
            {a.neededSkills && <p style={{ fontSize: "0.85rem" }}>🛠 {a.neededSkills}</p>}
            <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
              {a.signups.length} volunteer(s) signed up · by {a.createdBy.name}
              <VerifiedBadge didIdentifier={a.createdBy.didIdentifier} />
            </p>
            {signupFor === a.id ? (
              <SignupForm
                actionId={a.id}
                onDone={() => {
                  setSignupFor(null);
                  load();
                }}
              />
            ) : (
              <button className="btn" onClick={() => setSignupFor(a.id)}>
                Sign up
              </button>
            )}
          </div>
        ))}
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
    creatorName: "",
    creatorEmail: "",
  });
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/volunteer-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    onCreated();
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
      <label>
        Your name
        <input required value={form.creatorName} onChange={(e) => update("creatorName", e.target.value)} />
      </label>
      <label>
        Your email
        <input required type="email" value={form.creatorEmail} onChange={(e) => update("creatorEmail", e.target.value)} />
      </label>
      <button className="btn" disabled={loading} type="submit">
        {loading ? "Creating..." : "Create action"}
      </button>
    </form>
  );
}

function SignupForm({ actionId, onDone }: { actionId: string; onDone: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", skills: "", available: "" });
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/volunteer-actions/${actionId}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    onDone();
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 10 }}>
      <label>
        Name
        <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
      </label>
      <label>
        Email
        <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
      </label>
      <label>
        Skills / availability (optional)
        <input value={form.skills} onChange={(e) => update("skills", e.target.value)} />
      </label>
      <button className="btn" disabled={loading} type="submit">
        {loading ? "Signing up..." : "Confirm signup"}
      </button>
    </form>
  );
}
