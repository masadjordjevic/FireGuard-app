import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CampaignDonateForm from "@/components/CampaignDonateForm";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await prisma.donationCampaign.findUnique({ where: { id: params.id } });
  if (!campaign) notFound();

  const [aggregate, donations] = await Promise.all([
    prisma.donation.aggregate({
      where: { campaignId: campaign.id },
      _sum: { amountEth: true },
      _count: true,
    }),
    prisma.donation.findMany({
      where: { campaignId: campaign.id },
      orderBy: { createdAt: "desc" },
      include: { donor: { select: { name: true } } },
    }),
  ]);

  const totalEth = aggregate._sum.amountEth ?? 0;
  const pct = campaign.goalEth > 0 ? Math.min(100, Math.round((totalEth / campaign.goalEth) * 100)) : 0;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <p>
        <Link href="/campaigns" style={{ fontSize: "0.85rem" }}>
          ← All campaigns
        </Link>
      </p>

      <div className="card">
        <h1 style={{ marginTop: 0 }}>{campaign.title}</h1>
        <p style={{ color: "var(--smoke)" }}>{campaign.description}</p>
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
          {totalEth.toFixed(4)} / {campaign.goalEth} ETH raised ({pct}%) · {aggregate._count} donation(s)
        </p>
      </div>

      <div className="card">
        <h2>Donate</h2>
        <CampaignDonateForm campaignId={campaign.id} contractAddress={campaign.contractAddress} />
      </div>

      <div className="card">
        <h2>Donation History</h2>
        {donations.length === 0 ? (
          <p className="empty-state">No donations yet — be the first to support this campaign.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {donations.map((d) => (
              <li key={d.id} style={{ marginBottom: 6 }}>
                {d.amountEth} ETH by {d.donor?.name ?? "anonymous wallet"} —{" "}
                <a href={`https://sepolia.etherscan.io/tx/${d.txHash}`} target="_blank" rel="noreferrer">
                  view tx
                </a>{" "}
                <span style={{ fontSize: "0.8rem", color: "var(--smoke)" }}>
                  ({new Date(d.createdAt).toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
