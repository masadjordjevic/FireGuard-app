import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FireGuard",
  description: "Decentralized wildfire reporting & community response platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <Link href="/" className="brand">
            🔥 FireGuard
          </Link>
          <nav>
            <Link href="/map">Map</Link>
            <Link href="/report">Report Fire</Link>
            <Link href="/volunteers">Volunteer Hub</Link>
            <Link href="/donate">Donate</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
