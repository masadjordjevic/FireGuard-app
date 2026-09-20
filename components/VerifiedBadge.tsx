import { BadgeCheck } from "lucide-react";
import { isVerified } from "@/lib/did";

export default function VerifiedBadge({ didIdentifier }: { didIdentifier?: string | null }) {
  if (!isVerified({ didIdentifier })) return null;

  return (
    <span className="verified-badge" title={`DID: ${didIdentifier}`}>
      <BadgeCheck size={12} />
      Verified
    </span>
  );
}
