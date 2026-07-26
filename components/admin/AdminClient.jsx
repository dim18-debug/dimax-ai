"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

const TABS = [
  ["overview", "Prezentare"],
  ["users", "Utilizatori"],
  ["reports", "Rapoarte & erori"],
  ["settings", "Setări & prețuri"],
  ["faq", "Întrebări frecvente"],
];

export default function AdminClient({ admin }) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);

  const load = async () => {
    const [s, c] = await Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    setData(s);
    setConfig(c.config);
  };
  useEffect(() => { load(); }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] bg-ink-950">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/"><Logo /></Link>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-300">Panou de administrare</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/chat" className="btn-ghost text-sm">Deschide chatul</Link>
            <button onClick={logout} className="btn-ghost text-sm">Deconectare</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                tab === id ? "border-brand-500 text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!data ? (
          <p className="text-slate-400">Se încarcă datele…</p>
        ) : (
          <>
            {tab === "overview" && <Overview data={data} />}
            {tab === "users" && <Users data={data} onChange={load} />}
            {tab === "reports" && <Reports data={data} onChange={load} />}
            {tab === "settings" && config && <Settings config={config} onSaved={load} />}
            {tab === "faq" && config && <FaqAdmin config={config} onSaved={load} />}
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function Overview({ data }) {
  const s = data.stats;
  const max = Math.max(1, ...data.activity.map((a) => a.c));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Utilizatori" value={s.totalUsers} />
        <Stat label="Conversații" value={s.totalConversations} />
        <Stat label="Mesaje generate" value={s.totalMessages} />
        <Stat label="Utilizatori activi (7z)" value={s.activeUsers} />
        <Stat label="Abonamente active" value={s.activeSubs} />
        <Stat label="Cost estimat API" value={`$${s.estimatedCost}`} sub={`${s.totalTokens.toLocaleString()} tokeni`} />
        <Stat label="Cereri Premium" value={s.pendingUpgrades} sub="în așteptare" />
        <Stat label="Mesaje raportate" value={s.reportedCount} sub={`${s.errorCount} erori`} />
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Activitate (ultimele 14 zile)</h3>
        {data.activity.length === 0 ? (
          <p className="text-sm text-slate-500">Nicio activitate încă.</p>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {data.activity.map((a) => (
              <div key={a.d} className="flex flex-1 flex-col items-center gap-1" title={`${a.d}: ${a.c}`}>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-brand-600 to-violet-500"
                  style={{ height: `${(a.c / max) * 100}%`, minHeight: "4px" }}
                />
                <span className="text-[9px] text-slate-600">{a.d.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Users({ data, onChange }) {
  async function update(id, body) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    onChange();
  }
  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Rol</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Stare</th>
            <th className="px-4 py-3">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u.id} className="border-b border-white/5">
              <td className="px-4 py-3">
                <div className="text-white">{u.name || "—"}</div>
                <div className="text-xs text-slate-500">{u.email}</div>
              </td>
              <td className="px-4 py-3">{u.role}</td>
              <td className="px-4 py-3">
                <span className={u.plan === "premium" ? "text-brand-400" : "text-slate-400"}>{u.plan}</span>
              </td>
              <td className="px-4 py-3">
                {u.blocked ? <span className="text-red-400">Blocat</span> : <span className="text-emerald-400">Activ</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => update(u.id, { blocked: !u.blocked })}>
                    {u.blocked ? "Deblochează" : "Blochează"}
                  </button>
                  <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => update(u.id, { plan: u.plan === "premium" ? "free" : "premium" })}>
                    {u.plan === "premium" ? "→ Gratuit" : "→ Premium"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Reports({ data, onChange }) {
  const requests = data.upgradeRequests || [];
  async function handleRequest(id, status) {
    await fetch(`/api/admin/upgrade-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onChange();
  }
  return (
    <div className="space-y-6">
      <Panel title={`Cereri de trecere la Premium (${requests.length})`}>
        {requests.length === 0 ? <Empty /> : requests.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2.5 text-sm">
            <div>
              <div className="text-white">{r.email}</div>
              <div className="text-xs text-slate-500">{r.created_at} · plan curent: {r.plan}</div>
            </div>
            <div className="flex gap-1.5">
              <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => handleRequest(r.id, "approved")}>
                Aprobă → Premium
              </button>
              <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => handleRequest(r.id, "rejected")}>
                Respinge
              </button>
            </div>
          </li>
        ))}
      </Panel>

    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title={`Mesaje raportate (${data.reported.length})`}>
        {data.reported.length === 0 ? <Empty /> : data.reported.map((r) => (
          <li key={r.id} className="border-b border-white/5 py-2.5 text-sm">
            <div className="text-xs text-slate-500">{r.email} · {r.created_at}</div>
            <div className="mt-1 line-clamp-3 text-slate-300">{r.content}</div>
          </li>
        ))}
      </Panel>
      <Panel title={`Erori platformă (${data.errors.length})`}>
        {data.errors.length === 0 ? <Empty /> : data.errors.map((e) => (
          <li key={e.id} className="border-b border-white/5 py-2.5 text-sm">
            <div className="text-xs text-slate-500">{e.created_at}</div>
            <div className="mt-1 text-red-300">{e.message}</div>
            {e.context && <div className="text-xs text-slate-500">{e.context}</div>}
          </li>
        ))}
      </Panel>
      <Panel title={`Mesaje de contact (${data.contacts.length})`}>
        {data.contacts.length === 0 ? <Empty /> : data.contacts.map((c) => (
          <li key={c.id} className="border-b border-white/5 py-2.5 text-sm">
            <div className="text-xs text-slate-500">{c.email} · {c.created_at}</div>
            <div className="font-medium text-white">{c.subject}</div>
            <div className="mt-1 line-clamp-3 text-slate-300">{c.message}</div>
          </li>
        ))}
      </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      <ul className="max-h-[60vh] overflow-y-auto">{children}</ul>
    </div>
  );
}
function Empty() {
  return <li className="py-6 text-center text-sm text-slate-500">Nimic de afișat.</li>;
}

function Settings({ config, onSaved }) {
  const [form, setForm] = useState({
    announcement: config.announcement || "",
    systemPrompt: config.systemPrompt || "",
    limits: config.limits,
    prices: config.prices,
    brand: config.brand,
  });
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  }

  const upd = (path, value) =>
    setForm((f) => {
      const next = structuredClone(f);
      let o = next;
      for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
      o[path[path.length - 1]] = value;
      return next;
    });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white">Anunț pe site</h3>
        <p className="mb-2 text-xs text-slate-500">Apare ca banner în partea de sus. Lasă gol pentru a-l ascunde.</p>
        <input className="input" value={form.announcement} onChange={(e) => upd(["announcement"], e.target.value)} placeholder="Ex: Reducere 50% la Premium!" />
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white">Numele și sloganul platformei</h3>
        <div className="mt-3 space-y-3">
          <input className="input" value={form.brand.name} onChange={(e) => upd(["brand", "name"], e.target.value)} placeholder="Nume" />
          <input className="input" value={form.brand.tagline} onChange={(e) => upd(["brand", "tagline"], e.target.value)} placeholder="Slogan" />
          <textarea className="input min-h-[80px]" value={form.brand.subtitle} onChange={(e) => upd(["brand", "subtitle"], e.target.value)} placeholder="Subtitlu" />
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white">Instrucțiunile asistentului AI (system prompt)</h3>
        <textarea className="input mt-2 min-h-[140px] font-mono text-xs" value={form.systemPrompt} onChange={(e) => upd(["systemPrompt"], e.target.value)} />
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white">Limite zilnice de mesaje</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {["guest", "free", "premium"].map((k) => (
            <label key={k} className="text-sm">
              <span className="mb-1 block capitalize text-slate-400">{k}</span>
              <input type="number" className="input" value={form.limits[k]} onChange={(e) => upd(["limits", k], Number(e.target.value))} />
            </label>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white">Prețuri</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {["free", "premium"].map((k) => (
            <div key={k} className="rounded-xl border border-white/10 p-4">
              <p className="mb-2 font-medium capitalize text-white">{k}</p>
              <label className="mb-2 block text-xs text-slate-400">
                Preț
                <input type="number" step="0.01" className="input mt-1" value={form.prices[k].price} onChange={(e) => upd(["prices", k, "price"], Number(e.target.value))} />
              </label>
              <label className="block text-xs text-slate-400">
                Monedă
                <input className="input mt-1" value={form.prices[k].currency} onChange={(e) => upd(["prices", k, "currency"], e.target.value)} />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="btn-primary">Salvează setările</button>
        {saved && <span className="text-sm text-emerald-400">Salvat!</span>}
      </div>
    </div>
  );
}

function FaqAdmin({ config, onSaved }) {
  const [faqs, setFaqs] = useState(config.faqs || []);
  const [saved, setSaved] = useState(false);

  const update = (i, key, val) => setFaqs((f) => f.map((x, j) => (j === i ? { ...x, [key]: val } : x)));
  const add = () => setFaqs((f) => [...f, { q: "", a: "" }]);
  const remove = (i) => setFaqs((f) => f.filter((_, j) => j !== i));

  async function save() {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faqs: faqs.filter((f) => f.q.trim()) }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  }

  return (
    <div className="max-w-3xl space-y-4">
      {faqs.map((f, i) => (
        <div key={i} className="glass rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Întrebarea #{i + 1}</span>
            <button className="text-xs text-red-400 hover:underline" onClick={() => remove(i)}>Șterge</button>
          </div>
          <input className="input mb-2" placeholder="Întrebare" value={f.q} onChange={(e) => update(i, "q", e.target.value)} />
          <textarea className="input min-h-[70px]" placeholder="Răspuns" value={f.a} onChange={(e) => update(i, "a", e.target.value)} />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button onClick={add} className="btn-ghost">+ Adaugă întrebare</button>
        <button onClick={save} className="btn-primary">Salvează</button>
        {saved && <span className="text-sm text-emerald-400">Salvat!</span>}
      </div>
    </div>
  );
}
