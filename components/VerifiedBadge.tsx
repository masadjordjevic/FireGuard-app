import { isVerified } from "@/lib/did";

export default function VerifiedBadge({ didIdentifier }: { didIdentifier?: string | null }) {
  if (!isVerified({ didIdentifier })) return null;

  return (
    <span className="verified-badge" title={`DID: ${didIdentifier}`}>
      ✓ Verified
    </span>
  );
}
