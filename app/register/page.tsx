"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SELF_SERVICE_ROLES } from "@/lib/roles";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CITIZEN" as string });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Registration failed");
      }
      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signInRes?.error) throw new Error("Registered, but automatic login failed — please log in.");
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </label>
        <label>
          Email
          <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label>
          Password
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </label>
        <label>
          I am a...
          <select value={form.role} onChange={(e) => update("role", e.target.value)}>
            {SELF_SERVICE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <p style={{ fontSize: "0.8rem", color: "var(--smoke)", marginTop: -8 }}>
          Emergency service / validator accounts are granted manually by an administrator.
        </p>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <p style={{ fontSize: "0.85rem", marginTop: 12 }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
