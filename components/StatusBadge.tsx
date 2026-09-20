import { AlertCircle, ShieldCheck, AlertTriangle, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STATUS_ICONS: Record<string, LucideIcon> = {
  REPORTED: AlertCircle,
  VERIFIED: ShieldCheck,
  ACTIVE: AlertTriangle,
  RESOLVED: CheckCircle,
};

export default function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span className={`status-badge status-${status}`}>
      {Icon && <Icon size={13} />}
      {status}
    </span>
  );
}
