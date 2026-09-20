"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { isAdmin, isElevatedRole, formatRole } from "@/lib/roles";

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
      {isAdmin(session.user.role) && <Link href="/admin">Admin</Link>}
      <span className="nav-user">
        {session.user.name}
        <span className={`role-chip ${isElevatedRole(session.user.role) ? "role-chip-elevated" : ""}`}>
          {formatRole(session.user.role)}
        </span>
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
