import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";
export const metadata = { title: "Creează cont — DIMAX AI" };
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[100dvh] place-items-center bg-ink-950 text-slate-400">Se încarcă…</div>}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
