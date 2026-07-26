import { Suspense } from "react";
import ChatClient from "@/components/chat/ChatClient";

export const metadata = { title: "Asistent AI — DIMAX AI" };

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="grid h-[100dvh] place-items-center bg-ink-950 text-slate-400">Se încarcă…</div>}>
      <ChatClient />
    </Suspense>
  );
}
