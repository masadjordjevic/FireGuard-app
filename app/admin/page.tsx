import { prisma } from "@/lib/prisma";
import AdminIncidentsTable from "@/components/AdminIncidentsTable";
import VerifiedBadge from "@/components/VerifiedBadge";

// Always show current data, never a statically cached snapshot
export const dynamic = "force-dynamic";

// NOTE: this page has no authentication/authorization — anyone with the URL
// can view it and change incident statuses. Acceptable for an MVP demo, but
// it must sit behind an admin-only auth check before any real deployment.
export default async function AdminPage() {
  const [incidents, actions, donations, users] = await Promise.all([
    prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      include: { reportedBy: true },
    }),
    prisma.volunteerAction.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: true, signups: true },
    }),
    prisma.donation.findMany({
      orderBy: { createdAt: "desc" },
      include: { campaign: true, donor: true },
    }),
    prisma.user.findMany({
      orderBy: { reputation: "desc" },
    }),
  ]);

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p style={{ color: "var(--smoke)" }}>
        Overview of incidents, volunteer actions, donations and user reputation.
      </p>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Incidents ({incidents.length})</h2>
        <AdminIncidentsTable incidents={incidents} />
      </section>

      <section className="card">
        <h2>Volunteer Actions ({actions.length})</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Created by</th>
              <th>Signups</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.location}</td>
                <td>
                  {a.createdBy.name}
                  <VerifiedBadge didIdentifier={a.createdBy.didIdentifier} />
                </td>
                <td>{a.signups.length}</td>
              </tr>
            ))}
            {actions.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: "var(--smoke)" }}>
                  No volunteer actions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Donations ({donations.length})</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Amount (ETH)</th>
              <th>Donor</th>
              <th>Tx</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id}>
                <td>{d.campaign.title}</td>
                <td>{d.amountEth}</td>
                <td>{d.donor?.name ?? "Anonymous"}</td>
                <td>
                  <a href={`https://sepolia.etherscan.io/tx/${d.txHash}`} target="_blank" rel="noreferrer">
                    {d.txHash.slice(0, 10)}...
                  </a>
                </td>
                <td>{new Date(d.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {donations.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "var(--smoke)" }}>
                  No donations recorded yet. The Donate page currently sends ETH straight to the
                  smart contract and doesn't write a Donation row here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Users by Reputation ({users.length})</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Reputation</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.name}
                  <VerifiedBadge didIdentifier={u.didIdentifier} />
                </td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.reputation}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: "var(--smoke)" }}>
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
