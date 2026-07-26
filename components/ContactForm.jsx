"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState(null); // null | 'ok' | 'err'
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("ok");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("err");
      }
    } catch {
      setStatus("err");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-6 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">Nume</label>
          <input className="input" required value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">Email</label>
          <input className="input" type="email" required value={form.email} onChange={set("email")} />
        </div>
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-sm text-slate-300">Subiect</label>
        <input className="input" required value={form.subject} onChange={set("subject")} />
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-sm text-slate-300">Mesaj</label>
        <textarea className="input min-h-[140px] resize-y" required value={form.message} onChange={set("message")} />
      </div>

      {status === "ok" && (
        <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Mulțumim! Mesajul tău a fost trimis. Îți vom răspunde în curând.
        </p>
      )}
      {status === "err" && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          Mesajul nu a putut fi trimis. Verifică datele și încearcă din nou.
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-5 w-full sm:w-auto">
        {loading ? "Se trimite…" : "Trimite mesajul"}
      </button>
    </form>
  );
}
