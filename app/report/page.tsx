"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    latitude: "",
    longitude: "",
    evidenceUrl: "",
    reporterName: "",
    reporterEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      update("latitude", pos.coords.latitude.toFixed(6));
      update("longitude", pos.coords.longitude.toFixed(6));
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(JSON.stringify(data.error ?? "Failed to submit"));
      }
      router.push("/map");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1>Report a Fire</h1>
      <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
        Provide the location and details of the incident. It will appear on the map immediately
        and can be verified by emergency services or trusted validators.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Fire near Kosmaj forest edge"
          />
        </label>
        <label>
          Description
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What do you see? Size, smoke, wind direction, nearby structures..."
          />
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1 }}>
            Latitude
            <input
              required
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => update("latitude", e.target.value)}
            />
          </label>
          <label style={{ flex: 1 }}>
            Longitude
            <input
              required
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => update("longitude", e.target.value)}
            />
          </label>
        </div>
        <button type="button" className="btn" style={{ background: "var(--smoke)", marginBottom: 14 }} onClick={useMyLocation}>
          Use my current location
        </button>
        <label>
          Evidence URL (photo/video link, optional)
          <input
            type="url"
            value={form.evidenceUrl}
            onChange={(e) => update("evidenceUrl", e.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          Your name
          <input required value={form.reporterName} onChange={(e) => update("reporterName", e.target.value)} />
        </label>
        <label>
          Your email
          <input
            required
            type="email"
            value={form.reporterEmail}
            onChange={(e) => update("reporterEmail", e.target.value)}
          />
        </label>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit report"}
        </button>
      </form>
    </div>
  );
}
