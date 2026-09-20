import "./globals.css";
import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Link from "next/link";
import { Flame, Menu } from "lucide-react";
import Providers from "@/components/Providers";
import NavAuth from "@/components/NavAuth";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FireGuard",
  description: "Decentralized wildfire reporting & community response platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <Providers>
          <header className="nav">
            <Link href="/" className="brand">
              <Flame size={22} color="var(--ember-glow)" style={{ verticalAlign: "-4px", marginRight: 4 }} />
              Fire<span>Guard</span>
            </Link>
            <input type="checkbox" id="nav-toggle" className="nav-toggle-checkbox" />
            <label htmlFor="nav-toggle" className="nav-toggle-label">
              <Menu size={24} />
            </label>
            <nav>
              <Link href="/map">Map</Link>
              <Link href="/report">Report Fire</Link>
              <Link href="/volunteers">Volunteer Hub</Link>
              <Link href="/campaigns">Donate</Link>
              <NavAuth />
            </nav>
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
