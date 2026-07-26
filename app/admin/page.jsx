import { redirect } from "next/navigation";
import AdminClient from "@/components/admin/AdminClient";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Administrare — DIMAX AI" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  return <AdminClient admin={admin} />;
}
