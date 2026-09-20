# FireGuard — MVP

Decentralized wildfire reporting & community response platform. Next.js full-stack app +
Solidity donation contract on Sepolia testnet.

## Stack
- **Next.js 14** (App Router, TypeScript) — frontend + API routes
- **Prisma + PostgreSQL** — database (incidents, volunteer actions, users, donations)
- **react-leaflet** — interactive incident map (OpenStreetMap, no API key needed)
- **Hardhat + Solidity** — `DonationCampaign.sol` deployed to Ethereum Sepolia testnet
- **ethers.js** — connects MetaMask on the `/donate` page and calls the contract directly

## What's included (MVP scope)
-  **Report Fire** — form → saved to DB → appears on map immediately
-  **Map** — all incidents plotted with status badges
-  **Volunteer Hub** — create actions, sign up as a volunteer
-  **Donate** — connect wallet, send ETH to the smart contract on Sepolia, tx recorded on-chain


## Setup

```bash
npm install
cp .env.example .env         # then set DATABASE_URL to your Postgres connection string
npm run prisma:migrate      # applies the schema (first run creates migration history)
npm run dev                 # http://localhost:3000
```

## Project structure
```
app/
  page.tsx              home
  report/page.tsx       incident report form
  map/page.tsx           incident map (server) + IncidentMap (client)
  volunteers/page.tsx    volunteer hub
  donate/page.tsx        wallet-connected donation flow
  api/incidents/         REST endpoints for incidents
  api/volunteer-actions/ REST endpoints for volunteer actions + signups
components/              client components (map, volunteer hub)
lib/prisma.ts            Prisma client singleton
prisma/schema.prisma      data model
contracts/DonationCampaign.sol   donation smart contract
hardhat.config.js, scripts/deploy.js   Sepolia deployment
```
