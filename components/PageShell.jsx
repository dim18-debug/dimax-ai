import Navbar from "./Navbar";
import Footer from "./Footer";
import { getConfig } from "@/lib/config";

export default async function PageShell({ title, subtitle, children, wide = false }) {
  const cfg = await getConfig();
  return (
    <>
      {cfg.announcement ? (
        <div className="bg-gradient-to-r from-brand-600 to-violet-500 px-4 py-2 text-center text-sm font-medium text-white">
          {cfg.announcement}
        </div>
      ) : null}
      <Navbar />
      <main className="min-h-[70vh]">
        {title && (
          <div className="relative overflow-hidden border-b border-white/10">
            <div className="pointer-events-none absolute inset-0 bg-tech-grid" />
            <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h1>
              {subtitle && <p className="mx-auto mt-3 max-w-2xl text-slate-400">{subtitle}</p>}
            </div>
          </div>
        )}
        <div className={`mx-auto px-4 py-12 sm:px-6 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</div>
      </main>
      <Footer />
    </>
  );
}
