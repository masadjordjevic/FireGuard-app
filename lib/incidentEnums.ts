// Single source of truth for Incident.status and Incident.dangerLevel valid
// values — SQLite has no native enum type, so these are enforced by Zod in
// the API routes (see prisma/schema.prisma) and shared here so the UI
// (report form, admin status dropdown) can't drift from what the API accepts.

export const INCIDENT_STATUSES = ["REPORTED", "VERIFIED", "ACTIVE", "RESOLVED"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const DANGER_LEVELS = ["LOW", "MODERATE", "HIGH", "EXTREME"] as const;
export type DangerLevel = (typeof DANGER_LEVELS)[number];
