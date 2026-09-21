"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { isAdmin, formatRole } from "@/lib/roles";

export default function NavAuth() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") return null;

  if (!session) {
    return (
      <>
        <Link href="/login" className="nav-btn-outline">
          Log in
        </Link>
        <Link href="/register" className="nav-btn-primary">
          Register
        </Link>
      </>
    );
  }

  const initial = session.user.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="nav-user-menu" ref={menuRef}>
      <button className="nav-avatar" onClick={() => setOpen((o) => !o)} aria-label="Account menu">
        {initial}
      </button>
      {open && (
        <div className="nav-dropdown">
          <div className="nav-dropdown-header">
            {session.user.name} · {formatRole(session.user.role)}
          </div>
          <Link href="/profile" className="nav-dropdown-item" onClick={() => setOpen(false)}>
            Profile
          </Link>
          {isAdmin(session.user.role) && (
            <Link href="/admin" className="nav-dropdown-item" onClick={() => setOpen(false)}>
              Admin
            </Link>
          )}
          <button className="nav-dropdown-item" onClick={() => signOut({ callbackUrl: "/" })}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
