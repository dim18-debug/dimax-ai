"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

const OAUTH_ERRORS = {
  google_unavailable: "Login-ul cu Google nu este disponibil momentan.",
  apple_unavailable: "Login-ul cu Apple nu este disponibil momentan.",
  blocked: "Acest cont a fost blocat.",
};

export default function AuthForm({ mode }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState({ google: false, apple: false });

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((p) => setProviders(p))
      .catch(() => {});
    const err = params.get("error");
    if (err) setError(OAUTH_ERRORS[err] || "Autentificarea a eșuat. Încearcă din nou.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSocial = providers.google || providers.apple;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "A apărut o eroare.");
      } else {
        router.push(data.role === "admin" ? "/admin" : "/chat");
        router.refresh();
      }
    } catch {
      setError("Nu s-a putut contacta serverul.");
    } finally {
      setLoading(false);
    }
  }

  // Redirect to the real provider OAuth flow (server-initiated).
  function social(provider) {
    window.location.href = `/api/auth/${provider}`;
  }

  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-ink-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-tech-grid" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block"><Logo size={40} /></Link>
          <h1 className="mt-5 text-2xl font-bold text-white">
            {isLogin ? "Bine ai revenit" : "Creează-ți contul"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isLogin ? "Autentifică-te pentru a-ți accesa conversațiile." : "Salvează-ți conversațiile și deblochează funcțiile avansate."}
          </p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-card">
          {hasSocial && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {providers.google && (
                  <button onClick={() => social("google")} className="btn-ghost justify-center">
                    <GoogleIcon /> Google
                  </button>
                )}
                {providers.apple && (
                  <button onClick={() => social("apple")} className="btn-ghost justify-center">
                    <AppleIcon /> Apple
                  </button>
                )}
              </div>
              <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
                <div className="h-px flex-1 bg-white/10" /> sau cu email <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-3">
            {!isLogin && (
              <input className="input" placeholder="Nume (opțional)" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input
              className="input" type="email" placeholder="Email" required
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            />
            <input
              className="input" type="password" placeholder="Parolă" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Se procesează…" : isLogin ? "Autentificare" : "Creează cont"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          {isLogin ? (
            <>Nu ai cont? <Link href="/register" className="text-brand-400 underline">Creează unul</Link></>
          ) : (
            <>Ai deja cont? <Link href="/login" className="text-brand-400 underline">Autentifică-te</Link></>
          )}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.36 12.78c.02 2.43 2.13 3.24 2.15 3.25-.02.06-.34 1.16-1.12 2.3-.67.98-1.37 1.96-2.47 1.98-1.08.02-1.43-.64-2.66-.64-1.24 0-1.62.62-2.64.66-1.06.04-1.87-1.06-2.55-2.04-1.38-2-2.44-5.65-1.02-8.12.7-1.22 1.96-2 3.33-2.02 1.04-.02 2.02.7 2.66.7.63 0 1.83-.87 3.08-.74.52.02 1.99.21 2.94 1.59-.08.05-1.75 1.02-1.73 3.04M14.4 4.6c.57-.68.95-1.63.85-2.6-.82.03-1.81.55-2.39 1.23-.52.6-.98 1.57-.86 2.5.91.07 1.84-.46 2.4-1.13" />
    </svg>
  );
}
