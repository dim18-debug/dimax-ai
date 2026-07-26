export const dynamic = "force-dynamic";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getConfig } from "@/lib/config";

export default async function HomePage() {
  const cfg = await getConfig();

  return (
    <>
      {cfg.announcement ? (
        <div className="bg-gradient-to-r from-brand-600 to-violet-500 px-4 py-2 text-center text-sm font-medium text-white">
          {cfg.announcement}
        </div>
      ) : null}
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-tech-grid" />
          <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
            <div className="animate-fadeup mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
              Inteligență artificială · Română · Engleză · Русский
            </div>

            <h1 className="animate-fadeup text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              <span className="gradient-text">{cfg.brand.tagline}</span>
            </h1>

            <p className="animate-fadeup mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              {cfg.brand.subtitle}
            </p>

            <div className="animate-fadeup mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/chat" className="btn-primary px-7 py-3.5 text-base">
                Începe conversația
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/pricing" className="btn-ghost px-6 py-3.5 text-base">
                Vezi abonamentele
              </Link>
            </div>

            {/* Example questions */}
            <div className="mx-auto mt-14 max-w-3xl">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
                Exemple de întrebări
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {cfg.exampleQuestions.map((q) => (
                  <Link
                    key={q}
                    href={`/chat?q=${encodeURIComponent(q)}`}
                    className="glass rounded-full px-4 py-2 text-sm text-slate-200 transition hover:border-brand-500/40 hover:text-white"
                  >
                    {q}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 shadow-card">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 text-brand-400">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="glass rounded-3xl p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Un asistent pentru orice domeniu</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-400">
              Alege o categorie și primește ajutor imediat — de la scriere și traduceri, până la afaceri și tehnologie.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {cfg.quickCategories.map((c) => (
                <Link
                  key={c}
                  href={`/chat?cat=${encodeURIComponent(c)}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-brand-500/40 hover:bg-white/10 hover:text-white"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Gata să începi?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Deschide fereastra de chat și scrie prima ta întrebare. Primele mesaje sunt gratuite, fără cont.
          </p>
          <Link href="/chat" className="btn-primary mt-8 px-7 py-3.5 text-base">
            Începe conversația
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}

const FEATURES = [
  {
    title: "Răspunsuri clare și rapide",
    desc: "Primești răspunsuri bine structurate în câteva secunde, afișate treptat, în timp real.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
      </svg>
    ),
  },
  {
    title: "Scriere, traduceri și idei",
    desc: "Creează texte, traduce în română, engleză sau rusă și generează idei pentru orice proiect.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
      </svg>
    ),
  },
  {
    title: "Sigur și privat",
    desc: "Cheia API rămâne doar pe server. Îți poți șterge oricând conversațiile și contul.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" />
      </svg>
    ),
  },
];
