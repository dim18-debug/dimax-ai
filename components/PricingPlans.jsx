"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PricingPlans({ prices, limits }) {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user || null)).catch(() => setUser(null));
    fetch("/api/upgrade").then((r) => r.json()).then((d) => setPending(!!d.pending)).catch(() => {});
  }, []);

  async function requestPremium() {
    if (!user) {
      router.push("/register");
      return;
    }
    setLoading("premium");
    try {
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request" }),
      });
      if (res.ok) {
        setPending(true);
        setNotice("Cererea ta de trecere la Premium a fost înregistrată. Te contactăm în curând.");
      }
    } finally {
      setLoading("");
    }
  }

  async function cancelPremium() {
    setLoading("free");
    try {
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        setUser((u) => ({ ...u, plan: "free" }));
        setNotice("Ai revenit la planul Gratuit.");
        router.refresh();
      }
    } finally {
      setLoading("");
    }
  }

  const plans = [
    {
      id: "free",
      ...prices.free,
      highlight: false,
      features: [
        `${limits.free} întrebări pe zi`,
        "Acces la funcțiile de bază",
        "Istoric limitat",
        "Răspunsuri în timp real",
      ],
    },
    {
      id: "premium",
      ...prices.premium,
      highlight: true,
      features: [
        `${limits.premium} întrebări pe zi`,
        "Răspunsuri prioritare, mai rapide",
        "Istoric complet al conversațiilor",
        "Încărcarea documentelor și imaginilor",
        "Acces la funcții avansate",
      ],
    },
  ];

  return (
    <>
      {notice && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((p) => {
          const current = user?.plan === p.id;
          return (
            <div
              key={p.id}
              className={`relative rounded-3xl p-8 ${
                p.highlight ? "border-2 border-brand-500/50 bg-gradient-to-b from-brand-500/10 to-transparent shadow-glow" : "glass"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-3 py-1 text-xs font-semibold text-white">
                  Recomandat
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{p.label}</h3>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-white">
                  {p.price === 0 ? "0" : p.price} {p.currency}
                </span>
                <span className="pb-1 text-sm text-slate-400">/ {p.period}</span>
              </div>

              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <svg className="mt-0.5 shrink-0 text-brand-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {current ? (
                  p.id === "premium" ? (
                    <button onClick={cancelPremium} disabled={loading === "free"} className="btn-ghost w-full">
                      {loading === "free" ? "Se procesează…" : "Renunță la Premium"}
                    </button>
                  ) : (
                    <button disabled className="btn-ghost w-full cursor-default opacity-70">Planul tău actual</button>
                  )
                ) : p.id === "free" ? (
                  user ? (
                    <button disabled className="btn-ghost w-full cursor-default opacity-70">Inclus în contul tău</button>
                  ) : (
                    <Link href="/register" className="btn-ghost w-full">Începe gratuit</Link>
                  )
                ) : pending ? (
                  <button disabled className="btn-ghost w-full cursor-default opacity-70">Cerere trimisă ✓</button>
                ) : (
                  <button onClick={requestPremium} disabled={loading === "premium"} className="btn-primary w-full">
                    {loading === "premium" ? "Se trimite…" : user ? "Solicită Premium" : "Creează cont pentru Premium"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
