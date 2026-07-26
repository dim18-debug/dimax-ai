"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";

const NAV = [
  { href: "/", label: "Acasă" },
  { href: "/chat", label: "Asistent AI" },
  { href: "/about", label: "Despre platformă" },
  { href: "/faq", label: "Întrebări frecvente" },
  { href: "/pricing", label: "Abonamente" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user === undefined ? null : user ? (
            <>
              {user.role === "admin" && (
                <Link href="/admin" className="btn-ghost text-sm">
                  Admin
                </Link>
              )}
              <Link href="/account" className="btn-ghost text-sm">
                {user.name || user.email.split("@")[0]}
              </Link>
              <Link href="/chat" className="btn-primary text-sm">
                Deschide chatul
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                Autentificare
              </Link>
              <Link href="/chat" className="btn-primary text-sm">
                Începe conversația
              </Link>
            </>
          )}
        </div>

        <button
          className="icon-btn lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Meniu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <Link href="/account" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">
                  Contul meu
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">
                  Autentificare
                </Link>
              )}
              <Link href="/chat" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm">
                Chat
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
