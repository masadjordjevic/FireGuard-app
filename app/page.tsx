import Image from "next/image";
import Link from "next/link";
import { Flame, Map, Users, HandCoins } from "lucide-react";

export default function Home() {
  return (
    <div>
      <section className="hero-banner">
        <Image
          src="https://images.unsplash.com/photo-1615092296061-e2ccfeb2f3d6?q=80&w=1600&auto=format&fit=crop"
          alt="Wildfire burning across a hillside at dusk"
          fill
          priority
          className="hero-banner-image"
        />
        <div className="hero-banner-overlay" />
        <div className="hero-banner-content">
          <h1>Faster reporting. Trusted response. Transparent recovery.</h1>
          <p style={{ maxWidth: 560, margin: "12px auto 0" }}>
            FireGuard connects citizens, volunteers, emergency services, NGOs and donors
            in one shared ecosystem for wildfire reporting and community response.
          </p>
        </div>
      </section>

      <div className="grid">
        <Link href="/report" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>
            <Flame size={20} color="var(--ember)" style={{ verticalAlign: "-4px", marginRight: 6 }} />
            Report a Fire
          </h3>
          <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
            Submit location, description and evidence for a new incident.
          </p>
        </Link>
        <Link href="/map" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>
            <Map size={20} color="var(--ember)" style={{ verticalAlign: "-4px", marginRight: 6 }} />
            Incident Map
          </h3>
          <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
            View active and verified incidents near you.
          </p>
        </Link>
        <Link href="/volunteers" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>
            <Users size={20} color="var(--ember)" style={{ verticalAlign: "-4px", marginRight: 6 }} />
            Volunteer Hub
          </h3>
          <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
            Create or join community response actions.
          </p>
        </Link>
        <Link href="/campaigns" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>
            <HandCoins size={20} color="var(--ember)" style={{ verticalAlign: "-4px", marginRight: 6 }} />
            Donate
          </h3>
          <p style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
            Transparent, blockchain-tracked donations on Sepolia testnet.
          </p>
        </Link>
      </div>
    </div>
  );
}
