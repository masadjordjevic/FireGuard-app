import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import AdminIncidentsTable from "@/components/AdminIncidentsTable";
import AdminPendingVerifications from "@/components/AdminPendingVerifications";
import AdminSyncDonationsButton from "@/components/AdminSyncDonationsButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import { publicUserSelect } from "@/lib/publicUser";

// Always show current data, never a statically cached snapshot
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1>Access denied</h1>
        <p style={{ color: "var(--smoke)" }}>You don't have permission to view this page.</p>
      </div>
    );
  }

  const [incidents, actions, donations, users, pendingVerifications] = await Promise.all([
    prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      include: { reportedBy: { select: publicUserSelect } },
    }),
    prisma.volunteerAction.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: publicUserSelect }, signups: true },
    }),
    prisma.donation.findMany({
      orderBy: { createdAt: "desc" },
      include: { campaign: true, donor: { select: publicUserSelect } },
    }),
    prisma.user.findMany({
      orderBy: { reputation: "desc" },
      select: publicUserSelect,
    }),
    prisma.user.findMany({
      where: { emailVerified: false, verificationRequestedAt: { not: null } },
      orderBy: { verificationRequestedAt: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p style={{ color: "var(--smoke)" }}>
        Overview of incidents, volunteer actions, donations and user reputation.
      </p>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Pending Verifications ({pendingVerifications.length})</h2>
        <AdminPendingVerifications users={pendingVerifications} />
      </section>

      <section className="card">
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
                  <VerifiedBadge verified={a.createdBy.emailVerified} />
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Donations ({donations.length})</h2>
          <AdminSyncDonationsButton />
        </div>
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
                  No donations indexed yet. Donations are recorded here by the on-chain indexer
                  (see README) — use "Sync from chain" above to pull them in manually.
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
                  <VerifiedBadge verified={u.emailVerified} />
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
