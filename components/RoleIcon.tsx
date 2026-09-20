import { User, HeartHandshake, Handshake, Siren, BadgeCheck, Landmark, HandCoins, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ROLE_ICONS: Record<string, LucideIcon> = {
  CITIZEN: User,
  NGO: HeartHandshake,
  VOLUNTEER: Handshake,
  EMERGENCY_SERVICE: Siren,
  VALIDATOR: BadgeCheck,
  LOCAL_AUTHORITY: Landmark,
  DONOR: HandCoins,
  ADMIN: ShieldCheck,
};

export default function RoleIcon({ role, size = 13 }: { role: string; size?: number }) {
  const Icon = ROLE_ICONS[role] ?? User;
  return <Icon size={size} />;
}
