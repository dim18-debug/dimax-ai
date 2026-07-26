"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AccountClient({ user }) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [theme, setTheme] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("light") ? "light" : user.theme || "dark"
  );
  const [msg, setMsg] = useState("");

  async function saveProfile() {
    await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, theme }),
    });
    setMsg("Preferințele au fost salvate.");
    setTimeout(() => setMsg(""), 2000);
  }

  function applyTheme(t) {
    setTheme(t);
    if (t === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
    try { localStorage.setItem("smartai-theme", t); } catch {}
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function deleteConversations() {
    if (!confirm("Ștergi toate conversațiile? Această acțiune este ireversibilă.")) return;
    await fetch("/api/account?scope=conversations", { method: "DELETE" });
    setMsg("Toate conversațiile au fost șterse.");
    setTimeout(() => setMsg(""), 2000);
  }

  async function deleteAccount() {
    if (!confirm("Ștergi definitiv contul și toate datele asociate? Această acțiune nu poate fi anulată.")) return;
    await fetch("/api/account", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {msg && <p className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{msg}</p>}

      {/* Profile */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white">Profil</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Nume</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Email</label>
            <input className="input opacity-60" value={user.email} disabled />
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white">Preferințe</h2>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm text-slate-300">Temă</label>
          <div className="flex max-w-sm gap-2">
            <button
              onClick={() => applyTheme("dark")}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm ${theme === "dark" ? "border-brand-500 bg-brand-500/15 text-white" : "border-white/10 text-slate-300"}`}
            >
              Întunecată
            </button>
            <button
              onClick={() => applyTheme("light")}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm ${theme === "light" ? "border-brand-500 bg-brand-500/15 text-white" : "border-white/10 text-slate-300"}`}
            >
              Deschisă
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Asistentul răspunde automat în limba în care scrii (română, engleză sau rusă).
          </p>
        </div>
        <button onClick={saveProfile} className="btn-primary mt-5">Salvează preferințele</button>
      </section>

      {/* Plan */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white">Abonament</h2>
        <p className="mt-2 text-sm text-slate-400">
          Plan curent:{" "}
          <span className="font-semibold text-white">{user.plan === "premium" ? "Premium" : "Gratuit"}</span>
        </p>
        <a href="/pricing" className="btn-ghost mt-4 inline-flex">Gestionează abonamentul</a>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-300">Zonă sensibilă</h2>
        <p className="mt-2 text-sm text-slate-400">
          Poți șterge conversațiile sau întregul cont. Ștergerea contului elimină definitiv toate datele tale.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={deleteConversations} className="btn-ghost !border-red-500/30 text-red-200 hover:bg-red-500/10">
            Șterge toate conversațiile
          </button>
          <button onClick={deleteAccount} className="btn-ghost !border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20">
            Șterge contul
          </button>
        </div>
      </section>

      <div className="flex justify-between">
        <a href="/chat" className="btn-ghost">← Înapoi la chat</a>
        <button onClick={logout} className="btn-ghost">Deconectare</button>
      </div>
    </div>
  );
}
