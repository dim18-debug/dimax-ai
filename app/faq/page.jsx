export const dynamic = "force-dynamic";
import PageShell from "@/components/PageShell";
import { getConfig } from "@/lib/config";

export const metadata = { title: "Întrebări frecvente — DIMAX AI" };

export default async function FaqPage() {
  const { faqs } = await getConfig();
  return (
    <PageShell
      title="Întrebări frecvente"
      subtitle="Răspunsuri la cele mai comune întrebări despre DIMAX AI."
    >
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <details key={i} className="glass group rounded-2xl p-5 [&_svg]:open:rotate-45">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
              {f.q}
              <svg className="shrink-0 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}
