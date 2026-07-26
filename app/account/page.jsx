import { redirect } from "next/navigation";
import PageShell from "@/components/PageShell";
import AccountClient from "@/components/AccountClient";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Contul meu — DIMAX AI" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <PageShell title="Contul meu" subtitle="Gestionează-ți profilul, preferințele și datele.">
      <AccountClient user={user} />
    </PageShell>
  );
}
