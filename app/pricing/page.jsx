export const dynamic = "force-dynamic";
import PageShell from "@/components/PageShell";
import PricingPlans from "@/components/PricingPlans";
import { getConfig } from "@/lib/config";

export const metadata = { title: "Abonamente — DIMAX AI" };

export default async function PricingPage() {
  const { prices, limits } = await getConfig();
  return (
    <PageShell
      title="Planuri și abonamente"
      subtitle="Alege planul potrivit pentru tine. Prețurile sunt provizorii și pot fi modificate din panoul de administrare."
    >
      <PricingPlans prices={prices} limits={limits} />
      <p className="mt-8 text-center text-sm text-slate-500">
        Trecerea la Premium se face prin cerere: o înregistrăm și te contactăm pentru activare. Ai o întrebare?{" "}
        <a href="/contact" className="text-brand-400 underline">Scrie-ne</a>.
      </p>
    </PageShell>
  );
}
