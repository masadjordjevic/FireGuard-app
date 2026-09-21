import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

// Demo login password for every seeded user — shown in the console output
// below so whoever runs this for a presentation knows how to log in.
const DEMO_PASSWORD = "password123";

function randomTxHash(): string {
  return "0x" + randomBytes(32).toString("hex");
}

async function upsertUser(data: { name: string; email: string; role: string }) {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: data.email },
    update: { name: data.name, role: data.role, password },
    create: { ...data, password },
  });
}

async function findOrCreateIncident(data: {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  dangerLevel: string;
  status: string;
  photoUrl: string;
  reportedById: string;
}) {
  const existing = await prisma.incident.findFirst({ where: { title: data.title } });
  if (existing) {
    // Backfill photoUrl on incidents seeded before this field existed,
    // without touching status/dangerLevel in case a demo run changed them.
    if (!existing.photoUrl) {
      return prisma.incident.update({ where: { id: existing.id }, data: { photoUrl: data.photoUrl } });
    }
    return existing;
  }
  return prisma.incident.create({ data });
}

async function ensureConfirmation(incidentId: string, userId: string) {
  const existing = await prisma.confirmation.findFirst({ where: { incidentId, userId } });
  if (existing) return existing;
  return prisma.confirmation.create({ data: { incidentId, userId, trustLevel: 3 } });
}

async function findOrCreateAction(data: {
  title: string;
  description: string;
  location: string;
  neededSkills: string;
  createdById: string;
}) {
  const existing = await prisma.volunteerAction.findFirst({ where: { title: data.title } });
  if (existing) return existing;
  return prisma.volunteerAction.create({ data });
}

async function ensureSignup(actionId: string, userId: string, skills: string) {
  return prisma.volunteerSignup.upsert({
    where: { actionId_userId: { actionId, userId } },
    update: {},
    create: { actionId, userId, skills, available: "Weekends" },
  });
}

async function findOrCreateCampaign(data: {
  title: string;
  description: string;
  goalEth: number;
  contractAddress?: string | null;
}) {
  const existing = await prisma.donationCampaign.findFirst({ where: { title: data.title } });
  if (existing) return existing;
  return prisma.donationCampaign.create({ data });
}

async function ensureDonation(campaignId: string, donorId: string, amountEth: number) {
  const existing = await prisma.donation.findFirst({ where: { campaignId, donorId } });
  if (existing) return existing;
  return prisma.donation.create({ data: { campaignId, donorId, amountEth, txHash: randomTxHash() } });
}

async function main() {
  // --- Users: a mix of citizens, NGO organizers, and emergency responders ---
  const marko = await upsertUser({ name: "Marko Jovanović", email: "marko.jovanovic@example.com", role: "CITIZEN" });
  const ana = await upsertUser({ name: "Ana Kovač", email: "ana.kovac@example.com", role: "NGO" });
  const petar = await upsertUser({
    name: "Petar Nikolić",
    email: "petar.nikolic@fireservice.example.com",
    role: "EMERGENCY_SERVICE",
  });
  const ivana = await upsertUser({ name: "Ivana Horvat", email: "ivana.horvat@example.com", role: "CITIZEN" });
  const stefan = await upsertUser({
    name: "Stefan Đorđević",
    email: "stefan.djordjevic@fireservice.example.com",
    role: "EMERGENCY_SERVICE",
  });
  const marija = await upsertUser({ name: "Marija Babić", email: "marija.babic@example.com", role: "NGO" });
  const luka = await upsertUser({ name: "Luka Perić", email: "luka.peric@example.com", role: "CITIZEN" });
  const nikola = await upsertUser({ name: "Nikola Radović", email: "nikola.radovic@example.com", role: "CITIZEN" });
  const jovana = await upsertUser({ name: "Jovana Simić", email: "jovana.simic@example.com", role: "CITIZEN" });
  const milos = await upsertUser({
    name: "Miloš Pavlović",
    email: "milos.pavlovic@fireservice.example.com",
    role: "EMERGENCY_SERVICE",
  });
  const tamara = await upsertUser({ name: "Tamara Jovanović", email: "tamara.jovanovic@example.com", role: "NGO" });
  const aleksandar = await upsertUser({
    name: "Aleksandar Kovačević",
    email: "aleksandar.kovacevic@fireservice.example.com",
    role: "EMERGENCY_SERVICE",
  });
  const milica = await upsertUser({ name: "Milica Stanković", email: "milica.stankovic@example.com", role: "CITIZEN" });

  const allUsers = [marko, ana, petar, ivana, stefan, marija, luka, nikola, jovana, milos, tamara, aleksandar, milica];
  console.log(`Seeded ${allUsers.length} users (demo login password for all: "${DEMO_PASSWORD}")`);

  // Real Unsplash photos (found via search, not invented) sized/cropped
  // consistently — next/image generates the actual srcset at request time.
  const unsplashPhoto = (id: string) => `https://images.unsplash.com/photo-${id}?q=80&w=1200&auto=format&fit=crop`;

  // --- Incidents: split across Serbia and Croatia, varied status/danger ---
  const incidentDefs = [
    {
      title: "Fire near Kosmaj forest trail",
      description:
        "Hikers reported a small fire near the main forest trail on Kosmaj. Light smoke visible, no structures nearby yet.",
      latitude: 44.47,
      longitude: 20.56,
      dangerLevel: "MODERATE",
      status: "REPORTED",
      photoUrl: unsplashPhoto("1611174797136-5e167ea90d6c"),
      reportedBy: luka,
    },
    {
      title: "Grass fire spreading on Kosmaj southern slope",
      description:
        "Dry grass fire spreading quickly on the southern slope, pushed by moderate wind toward nearby farmland. Fire crews en route.",
      latitude: 44.465,
      longitude: 20.575,
      dangerLevel: "HIGH",
      status: "ACTIVE",
      photoUrl: unsplashPhoto("1692364221415-654b20e6d1d2"),
      reportedBy: marko,
      confirmedBy: petar,
    },
    {
      title: "Smoke spotted over Fruška Gora ridge",
      description:
        "Local rangers confirmed smoke rising from a wooded area near the ridge trail. Cause is still unknown.",
      latitude: 45.16,
      longitude: 19.85,
      dangerLevel: "MODERATE",
      status: "VERIFIED",
      photoUrl: unsplashPhoto("1536245344390-dbf1df63c30a"),
      reportedBy: ivana,
      confirmedBy: stefan,
    },
    {
      title: "Wildfire near Novi Sad outskirts",
      description:
        "Small brush fire near a residential area outside Novi Sad. Extinguished by the local fire brigade within hours, no damage reported.",
      latitude: 45.23,
      longitude: 19.75,
      dangerLevel: "LOW",
      status: "RESOLVED",
      photoUrl: unsplashPhoto("1551207004-3e38b4f52ba6"),
      reportedBy: marko,
    },
    {
      title: "Fire outbreak on Stara Planina eastern ridge",
      description:
        "Smoke visible near the eastern ridge, moderate wind pushing flames toward the forest edge. Remote area, access is difficult for fire crews.",
      latitude: 43.38,
      longitude: 22.62,
      dangerLevel: "EXTREME",
      status: "REPORTED",
      photoUrl: unsplashPhoto("1634009653379-a97409ee15de"),
      reportedBy: luka,
    },
    {
      title: "Brushfire on Velebit mountain trail",
      description:
        "Fire confirmed along a popular hiking trail on Velebit. Strong coastal winds are increasing the risk of rapid spread.",
      latitude: 44.65,
      longitude: 15.15,
      dangerLevel: "HIGH",
      status: "VERIFIED",
      photoUrl: unsplashPhoto("1511027643875-5cbb0439c8f1"),
      reportedBy: ana,
      confirmedBy: petar,
    },
    {
      title: "Fire threatening olive groves near Split",
      description:
        "Fast-moving fire threatening olive groves and a small hamlet outside Split. Evacuation of nearby households is underway.",
      latitude: 43.56,
      longitude: 16.48,
      dangerLevel: "EXTREME",
      status: "ACTIVE",
      photoUrl: unsplashPhoto("1507680465142-ef2223e23308"),
      reportedBy: marija,
      confirmedBy: stefan,
    },
    {
      title: "Smoke reported on Biokovo slopes",
      description:
        "A hiker reported smoke on the lower slopes of Biokovo near a marked trail. Not yet confirmed by local authorities.",
      latitude: 43.32,
      longitude: 17.12,
      dangerLevel: "MODERATE",
      status: "REPORTED",
      photoUrl: unsplashPhoto("1619461129861-d0c1479c48b4"),
      reportedBy: ivana,
    },
    {
      title: "Fire near Plitvice Lakes buffer zone",
      description:
        "Park rangers confirmed a fire in the protected buffer zone surrounding Plitvice Lakes National Park. Tourist paths are temporarily closed.",
      latitude: 44.8654,
      longitude: 15.582,
      dangerLevel: "HIGH",
      status: "VERIFIED",
      photoUrl: unsplashPhoto("1575867094974-9e16b6f55360"),
      reportedBy: luka,
      confirmedBy: petar,
    },
    {
      title: "Fire aftermath on Zlatibor hiking path",
      description:
        "A contained fire left a scorched path through pine forest near Zlatibor. Fire service confirms the area is now safe to approach.",
      latitude: 43.73,
      longitude: 19.7,
      dangerLevel: "LOW",
      status: "RESOLVED",
      photoUrl: unsplashPhoto("1762130099386-a206cd876302"),
      reportedBy: nikola,
      confirmedBy: milos,
    },
    {
      title: "Smoke column rising over Tara National Park",
      description:
        "Park staff spotted a dense smoke column over a remote section of Tara National Park. Difficult terrain is slowing crew access.",
      latitude: 43.9,
      longitude: 19.35,
      dangerLevel: "HIGH",
      status: "REPORTED",
      photoUrl: unsplashPhoto("1731739994975-d55f1a94cff9"),
      reportedBy: jovana,
    },
    {
      title: "Wildfire threatening ski resort access road near Kopaonik",
      description:
        "Fast-spreading fire near the main access road to Kopaonik. Emergency services have closed the road as a precaution.",
      latitude: 43.28,
      longitude: 20.81,
      dangerLevel: "EXTREME",
      status: "ACTIVE",
      photoUrl: unsplashPhoto("1726004478569-61b66fa2198b"),
      reportedBy: milica,
      confirmedBy: aleksandar,
    },
    {
      title: "Fire spotted in Krka National Park canyon",
      description:
        "Visitors reported flames in the canyon below one of the main waterfalls at Krka National Park. Boat traffic on the river has been suspended.",
      latitude: 43.8,
      longitude: 15.97,
      dangerLevel: "HIGH",
      status: "VERIFIED",
      photoUrl: unsplashPhoto("1726004522548-2883314a4e2d"),
      reportedBy: tamara,
      confirmedBy: aleksandar,
    },
    {
      title: "Brushfire near Paklenica canyon entrance",
      description:
        "A brushfire broke out close to the main entrance of Paklenica National Park, sending smoke over the parking area. Visitors were evacuated as a precaution.",
      latitude: 44.33,
      longitude: 15.62,
      dangerLevel: "MODERATE",
      status: "VERIFIED",
      photoUrl: unsplashPhoto("1736355895984-a07a970ead7e"),
      reportedBy: milica,
      confirmedBy: milos,
    },
    {
      title: "Fire reported on Učka mountain slope",
      description:
        "A hiker photographed open flames on a slope of Učka mountain overlooking the Istrian coast. Local fire crews are en route.",
      latitude: 45.3,
      longitude: 14.14,
      dangerLevel: "MODERATE",
      status: "REPORTED",
      photoUrl: unsplashPhoto("1720453221316-290ea38c6fd2"),
      reportedBy: nikola,
    },
  ];

  for (const def of incidentDefs) {
    const { reportedBy, confirmedBy, ...rest } = def;
    const incident = await findOrCreateIncident({ ...rest, reportedById: reportedBy.id });
    if (confirmedBy) await ensureConfirmation(incident.id, confirmedBy.id);
  }

  console.log(`Seeded ${incidentDefs.length} incidents across Serbia and Croatia`);

  // --- Volunteer actions ---
  const actionDefs = [
    {
      title: "Post-fire cleanup near Kosmaj",
      description:
        "Help clear debris and fire-damaged vegetation along the Kosmaj forest trails after the recent fire.",
      location: "Kosmaj, Serbia",
      neededSkills: "Physical work, protective gloves recommended",
      createdBy: marko,
      signups: [
        { user: luka, skills: "Available for weekend shifts" },
        { user: ivana, skills: "Has protective gear" },
      ],
    },
    {
      title: "Water supply distribution for firefighters near Velebit",
      description:
        "Coordinate delivery of drinking water and supplies to fire crews working the Velebit wildfire response.",
      location: "Velebit, Croatia",
      neededSkills: "Driving license, own vehicle preferred",
      createdBy: ana,
      signups: [
        { user: marko, skills: "Has a van for transport" },
        { user: luka, skills: "Available evenings" },
      ],
    },
    {
      title: "Evacuation support near Split",
      description: "Assist elderly residents near Split with temporary relocation during the active wildfire response.",
      location: "Split area, Croatia",
      neededSkills: "Car, basic first aid a plus",
      createdBy: marija,
      signups: [
        { user: ana, skills: "First aid certified" },
        { user: ivana, skills: "Speaks Italian and English" },
      ],
    },
    {
      title: "Fruška Gora forest patrol volunteers",
      description:
        "Join a volunteer patrol group monitoring for early signs of fire recurrence across Fruška Gora trails.",
      location: "Fruška Gora, Serbia",
      neededSkills: "Comfortable hiking, radio communication basics",
      createdBy: ivana,
      signups: [
        { user: marko, skills: "Familiar with the trail network" },
        { user: marija, skills: "Owns a two-way radio" },
      ],
    },
    {
      title: "Water station volunteers near Kopaonik",
      description: "Set up and staff a water and rest station along the access road for crews fighting the Kopaonik wildfire.",
      location: "Kopaonik, Serbia",
      neededSkills: "Able to lift supplies, own transport a plus",
      createdBy: milos,
      signups: [
        { user: nikola, skills: "Has a pickup truck" },
        { user: milica, skills: "Available all week" },
      ],
    },
    {
      title: "Debris cleanup at Zlatibor burn site",
      description: "Help clear scorched debris and fallen branches along the reopened Zlatibor hiking path.",
      location: "Zlatibor, Serbia",
      neededSkills: "Physical work, sturdy boots recommended",
      createdBy: nikola,
      signups: [
        { user: jovana, skills: "Weekend availability" },
        { user: luka, skills: "Has gloves and a chainsaw" },
      ],
    },
    {
      title: "Boat traffic coordination at Krka National Park",
      description: "Assist park rangers with rerouting visitor boat traffic away from the canyon affected by the fire.",
      location: "Krka National Park, Croatia",
      neededSkills: "Comfortable on boats, good communication skills",
      createdBy: tamara,
      signups: [
        { user: aleksandar, skills: "Certified boat operator" },
        { user: ana, skills: "Speaks Croatian and English" },
      ],
    },
    {
      title: "Visitor evacuation support at Paklenica",
      description: "Help guide visitors safely away from the Paklenica canyon entrance and coordinate parking area evacuation.",
      location: "Paklenica, Croatia",
      neededSkills: "Calm under pressure, crowd guidance experience a plus",
      createdBy: milica,
      signups: [
        { user: milos, skills: "Trained in crowd control" },
        { user: tamara, skills: "Bilingual, Italian and English" },
      ],
    },
  ];

  for (const def of actionDefs) {
    const { createdBy, signups, ...rest } = def;
    const action = await findOrCreateAction({ ...rest, createdById: createdBy.id });
    for (const signup of signups) {
      await ensureSignup(action.id, signup.user.id, signup.skills);
    }
  }

  console.log(`Seeded ${actionDefs.length} volunteer actions with signups`);

  // --- Donation campaigns ---
  // Drop the earlier generic placeholder campaigns from before this dataset
  // existed — only if they never received a donation, so real data is never
  // touched.
  await prisma.donationCampaign.deleteMany({
    where: { title: { in: ["Equipment & Gear Fund", "Environmental Recovery Fund"] }, donations: { none: {} } },
  });

  // The flagship campaign reuses the real deployed Sepolia contract (if one
  // is configured) — no fake donations are added to it, since it may already
  // carry real on-chain history.
  await findOrCreateCampaign({
    title: "FireGuard Emergency Response Fund",
    description: "Immediate support for volunteer fire crews responding to active wildfires.",
    goalEth: 1,
    contractAddress: process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS || null,
  });

  const campaignDefs = [
    {
      title: "Velebit Wildfire Emergency Response Fund",
      description: "Supporting fire crews and equipment for the ongoing wildfire response on Velebit mountain.",
      goalEth: 2,
      donations: [
        { donor: ana, amountEth: 0.15 },
        { donor: luka, amountEth: 0.3 },
      ],
    },
    {
      title: "Kosmaj Forest Recovery Fund",
      description: "Reforestation and trail restoration efforts for areas affected by recent fires on Kosmaj.",
      goalEth: 1.5,
      donations: [
        { donor: marko, amountEth: 0.1 },
        { donor: ivana, amountEth: 0.2 },
      ],
    },
    {
      title: "Dalmatia Wildfire Relief Fund",
      description: "Emergency relief for communities near Split affected by wildfire evacuations.",
      goalEth: 2.5,
      donations: [
        { donor: marija, amountEth: 0.5 },
        { donor: stefan, amountEth: 0.1 },
      ],
    },
    {
      title: "Kopaonik Wildfire Emergency Fund",
      description: "Urgent support for crews battling the fast-spreading wildfire threatening the Kopaonik access road.",
      goalEth: 3,
      donations: [
        { donor: milica, amountEth: 0.4 },
        { donor: nikola, amountEth: 0.2 },
      ],
    },
    {
      title: "Krka National Park Restoration Fund",
      description: "Restoring canyon trails and river ecosystems affected by the recent fire at Krka National Park.",
      goalEth: 1.5,
      donations: [
        { donor: tamara, amountEth: 0.25 },
        { donor: aleksandar, amountEth: 0.1 },
      ],
    },
    {
      title: "Zlatibor Trail Recovery Fund",
      description: "Rebuilding hiking infrastructure and replanting trees along the Zlatibor path damaged by fire.",
      goalEth: 1,
      donations: [
        { donor: jovana, amountEth: 0.05 },
        { donor: luka, amountEth: 0.15 },
      ],
    },
  ];

  for (const def of campaignDefs) {
    const { donations, ...rest } = def;
    const campaign = await findOrCreateCampaign(rest);
    for (const donation of donations) {
      await ensureDonation(campaign.id, donation.donor.id, donation.amountEth);
    }
  }

  console.log(`Seeded ${campaignDefs.length} new donation campaigns with demo donations`);
  console.log("Note: demo donation tx hashes are randomly generated, not real on-chain transactions.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
