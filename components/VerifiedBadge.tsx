import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ verified }: { verified?: boolean | null }) {
  if (!verified) return null;

  return (
    <span className="verified-badge" title="Verified email">
      <BadgeCheck size={12} />
      Verified
    </span>
  );
}
