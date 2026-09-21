"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRole } from "@/lib/roles";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminPendingVerifications({ users }: { users: PendingUser[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDecision(id: string, approved: boolean) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verify-user/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update verification");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{formatRole(u.role)}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn"
                  style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                  onClick={() => handleDecision(u.id, true)}
                  disabled={busyId === u.id}
                >
                  Approve
                </button>
                <button
                  className="btn"
                  style={{ padding: "4px 12px", fontSize: "0.85rem", background: "var(--smoke)" }}
                  onClick={() => handleDecision(u.id, false)}
                  disabled={busyId === u.id}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: "var(--smoke)" }}>
                No pending verification requests.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
