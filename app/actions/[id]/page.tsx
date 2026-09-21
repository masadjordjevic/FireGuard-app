import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/lib/publicUser";
import { MapPin, Wrench } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import ActionSignupPanel from "@/components/ActionSignupPanel";

export const dynamic = "force-dynamic";

export default async function ActionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const action = await prisma.volunteerAction.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: publicUserSelect },
      signups: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: publicUserSelect } },
      },
    },
  });

  if (!action) notFound();

  const initiallySignedUp = session ? action.signups.some((s) => s.userId === session.user.id) : false;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{action.title}</h1>
        <p>{action.description}</p>
        <p style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={15} color="var(--ember)" /> {action.location}
        </p>
        {action.neededSkills && (
          <p style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
            <Wrench size={15} color="var(--smoke)" /> Needed skills: {action.neededSkills}
          </p>
        )}
        {action.startsAt && (
          <p style={{ fontSize: "0.9rem", color: "var(--smoke)" }}>
            Starts: {new Date(action.startsAt).toLocaleString()}
          </p>
        )}
        <p style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
          Created by {action.createdBy.name}
          <VerifiedBadge verified={action.createdBy.emailVerified} />
        </p>
      </div>

      <div className="card">
        <h2>Join this action</h2>
        <ActionSignupPanel actionId={action.id} initiallySignedUp={initiallySignedUp} />
      </div>

      <div className="card">
        <h2>Volunteers signed up ({action.signups.length})</h2>
        {action.signups.length === 0 ? (
          <p style={{ color: "var(--smoke)" }}>No one has signed up yet.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {action.signups.map((s) => (
              <li key={s.id} style={{ marginBottom: 6 }}>
                <strong>{s.user.name}</strong>
                <VerifiedBadge verified={s.user.emailVerified} />
                {s.skills && <span style={{ fontSize: "0.85rem", color: "var(--smoke)" }}> — {s.skills}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
