import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";
export const metadata = { title: "Autentificare — DIMAX AI" };
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[100dvh] place-items-center bg-ink-950 text-slate-400">Se încarcă…</div>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
