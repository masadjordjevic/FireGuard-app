"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session) {
    return (
      <>
        <Link href="/login">Log in</Link>
        <Link href="/register">Register</Link>
      </>
    );
  }

  return (
    <>
      <Link href="/profile">Profile</Link>
      <span style={{ color: "var(--smoke)", fontSize: "0.9rem" }}>
        {session.user.name} · {session.user.role}
      </span>
      <button
        className="btn"
        style={{ padding: "4px 12px", fontSize: "0.85rem" }}
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Log out
      </button>
    </>
  );
}
