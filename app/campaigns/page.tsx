import Image from "next/image";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [campaigns, totals] = await Promise.all([
    prisma.donationCampaign.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.donation.groupBy({ by: ["campaignId"], _sum: { amountEth: true } }),
  ]);

  const totalByCampaign = new Map(totals.map((t) => [t.campaignId, t._sum.amountEth ?? 0]));

  return (
    <div>
      <section className="hero-banner hero-banner-subtle">
        <Image
          src="https://images.unsplash.com/photo-1782320143504-fb21d32e6dcd?q=80&w=1600&auto=format&fit=crop"
          alt="Massive wildfire smoke plume at sunset over mountains"
          fill
          className="hero-banner-image"
        />
        <div className="hero-banner-overlay" />
        <div className="hero-banner-content">
          <h2>Donation Campaigns</h2>
          <p>Transparent, on-chain support for wildfire response and recovery.</p>
        </div>
      </section>
      <p style={{ color: "var(--smoke)" }}>{campaigns.length} campaign(s).</p>
      <div className="grid">
        {campaigns.map((c) => {
          const totalEth = totalByCampaign.get(c.id) ?? 0;
          const pct = c.goalEth > 0 ? Math.min(100, Math.round((totalEth / c.goalEth) * 100)) : 0;
          return (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="card card-accent-support"
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <h3 style={{ marginTop: 0 }}>{c.title}</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--smoke)" }}>{c.description}</p>
              <div
                style={{
                  background: "var(--border)",
                  borderRadius: 999,
                  height: 10,
                  overflow: "hidden",
                  margin: "8px 0",
                }}
              >
                <div style={{ background: "var(--support)", width: `${pct}%`, height: "100%" }} />
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
                {totalEth.toFixed(4)} / {c.goalEth} ETH raised ({pct}%)
              </p>
              {!c.contractAddress && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--smoke)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <AlertTriangle size={13} /> No contract deployed yet.
                </p>
              )}
            </Link>
          );
        })}
        {campaigns.length === 0 && (
          <p className="empty-state">No active campaigns right now — check back soon.</p>
        )}
      </div>
    </div>
  );
}
