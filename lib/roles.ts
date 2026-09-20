// Full role taxonomy is free-text on User.role (see prisma/schema.prisma
// comment) since SQLite has no native enum. Only a subset is safe to let a
// user pick for themselves — EMERGENCY_SERVICE and VALIDATOR both unlock
// high-trust incident confirmation (app/api/incidents/[id]/confirm/route.ts),
// so they must only ever be granted manually (e.g. via Prisma Studio), never
// through self-service registration or profile editing.
export const SELF_SERVICE_ROLES = ["CITIZEN", "NGO"] as const;
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

// Platform-operator access (the /admin dashboard: incident status overrides,
// full user list, donation records) is a distinct concern from field
// verification authority (EMERGENCY_SERVICE/VALIDATOR, see above) — kept as
// its own role rather than overloading an existing one, but same rule
// applies: only ever granted manually (e.g. via Prisma Studio).
export const ADMIN_ROLES = ["ADMIN"] as const;

export function isAdmin(role: string | undefined | null): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

const HIGH_TRUST_ROLES = ["EMERGENCY_SERVICE", "VALIDATOR"];

export function isElevatedRole(role: string | undefined | null): boolean {
  return !!role && (isAdmin(role) || HIGH_TRUST_ROLES.includes(role));
}

// Display-only: "EMERGENCY_SERVICE" -> "Emergency Service". The stored value
// stays the plain uppercase string (see schema comment above) — this is
// purely a UI presentation choice, not a data format change.
export function formatRole(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
