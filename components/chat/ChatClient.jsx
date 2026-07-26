"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import Markdown from "@/components/Markdown";
import {
  IconSend, IconStop, IconCopy, IconCheck, IconRefresh, IconUp, IconDown,
  IconPlus, IconTrash, IconStar, IconEdit, IconClip, IconFlag, IconMenu, IconX,
  IconClock, IconGear, IconUser, IconBot,
} from "./Icons";

const WELCOME = "Bun venit! Sunt asistentul tău inteligent. Cu ce te pot ajuta astăzi?";
const CATEGORIES = [
  "Scriere și traducere", "Afaceri și marketing", "Educație",
  "Tehnologie", "Călătorii", "Idei și creativitate",
];
const CATEGORY_PROMPTS = {
  "Scriere și traducere": "Ajută-mă cu scriere și traducere. Vreau să ",
  "Afaceri și marketing": "Ajută-mă cu afaceri și marketing. Am nevoie să ",
  "Educație": "Explică-mi pe înțelesul tuturor următorul subiect: ",
  "Tehnologie": "Am o întrebare de tehnologie: ",
  "Călătorii": "Recomandă-mi idei pentru o călătorie. Aș vrea ",
  "Idei și creativitate": "Dă-mi idei creative pentru ",
};

export default function ChatClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [user, setUser] = useState(undefined);
  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const currentIdRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [savedOnly, setSavedOnly] = useState(false);
  const [uploadNote, setUploadNote] = useState("");

  const controllerRef = useRef(null);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);
  const didInit = useRef(false);

  const setCurrent = (id) => { currentIdRef.current = id; setCurrentId(id); };

  // ---- data loaders ----
  const loadConversations = useCallback(async () => {
    try {
      const r = await fetch("/api/conversations");
      const d = await r.json();
      setConversations(d.conversations || []);
    } catch {}
  }, []);

  const loadMessages = useCallback(async (id) => {
    try {
      const r = await fetch(`/api/conversations/${id}`);
      if (!r.ok) return;
      const d = await r.json();
      setMessages((d.messages || []).map((m) => ({ ...m })));
    } catch {}
  }, []);

  // ---- init ----
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user || null);
        if (d.user) loadConversations();
      })
      .catch(() => setUser(null));
  }, [loadConversations]);

  // Handle ?q= / ?cat= once
  useEffect(() => {
    if (didInit.current || user === undefined) return;
    didInit.current = true;
    const q = params.get("q");
    const cat = params.get("cat");
    if (q) {
      setInput(q);
    } else if (cat && CATEGORY_PROMPTS[cat]) {
      setInput(CATEGORY_PROMPTS[cat]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // autoscroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  // autosize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  // ---- streaming core ----
  const runStream = useCallback(
    async (history, images = []) => {
      setStreaming(true);
      setRateLimited(false);
      const controller = new AbortController();
      controllerRef.current = controller;
      setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

      const setLastAssistant = (updater, extra = {}) =>
        setMessages((prev) => {
          const copy = [...prev];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === "assistant") {
              copy[i] = { ...copy[i], content: updater(copy[i].content), ...extra };
              break;
            }
          }
          return copy;
        });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            conversationId: currentIdRef.current,
            images,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          if (d.code === "RATE_LIMIT") setRateLimited(true);
          setLastAssistant(() => d.error || "Nu am putut genera răspunsul. Te rugăm să încerci din nou.", {
            streaming: false,
            error: true,
          });
          return;
        }

        const convHeader = res.headers.get("x-conversation-id");
        if (convHeader && Number(convHeader) !== currentIdRef.current) {
          setCurrent(Number(convHeader));
        }

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setLastAssistant(() => acc);
        }
        setLastAssistant((c) => c, { streaming: false });

        if (user) {
          await loadConversations();
          if (convHeader) await loadMessages(Number(convHeader)); // sync real ids/feedback
        }
      } catch (e) {
        if (controller.signal.aborted) {
          setLastAssistant((c) => c, { streaming: false, stopped: true });
        } else {
          setLastAssistant(
            () => "Nu am putut genera răspunsul. Te rugăm să încerci din nou.",
            { streaming: false, error: true }
          );
        }
      } finally {
        setStreaming(false);
        controllerRef.current = null;
      }
    },
    [user, loadConversations, loadMessages]
  );

  // ---- actions ----
  const send = useCallback(
    async (raw) => {
      const text = (raw ?? input).trim();
      if ((!text && attachments.length === 0) || streaming) return;

      let outgoing = text;
      const images = [];
      for (const a of attachments) {
        if (a.dataUrl) {
          images.push(a.dataUrl); // real image sent to the vision model
        } else if (a.text) {
          outgoing += `\n\n[Conținut fișier „${a.name}”]\n${a.text.slice(0, 4000)}`;
        }
      }
      if (!outgoing && images.length) outgoing = "(imagine trimisă)";

      const userMsg = { role: "user", content: outgoing, images };
      const history = [...messages, userMsg];
      setMessages(history);
      setInput("");
      setAttachments([]);
      await runStream(history, images);
    },
    [input, attachments, streaming, messages, runStream]
  );

  const stop = () => controllerRef.current?.abort();

  const regenerate = async () => {
    if (streaming) return;
    // Drop trailing assistant messages, keep up to last user turn.
    let cut = messages.length;
    while (cut > 0 && messages[cut - 1].role === "assistant") cut--;
    const history = messages.slice(0, cut);
    if (!history.length) return;
    setMessages(history);
    await runStream(history);
  };

  const newConversation = () => {
    if (streaming) return;
    setCurrent(null);
    setMessages([]);
    setInput("");
    setAttachments([]);
    setSidebarOpen(false);
  };

  const openConversation = async (id) => {
    if (streaming) return;
    setCurrent(id);
    setSidebarOpen(false);
    await loadMessages(id);
  };

  const renameConversation = async (id, currentTitle) => {
    const title = prompt("Redenumește conversația:", currentTitle);
    if (title == null) return;
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    loadConversations();
  };

  const toggleSave = async (id, saved) => {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved: !saved }),
    });
    loadConversations();
  };

  const deleteConversation = async (id) => {
    if (!confirm("Ștergi definitiv această conversație?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (id === currentId) newConversation();
    loadConversations();
  };

  const copyMessage = async (content, idx) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {}
  };

  const sendFeedback = async (msg, value) => {
    if (!msg.id) return;
    const next = msg.feedback === value ? 0 : value;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, feedback: next } : m)));
    await fetch(`/api/messages/${msg.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: next }),
    });
  };

  const reportMessage = async (msg) => {
    if (!msg.id || !confirm("Raportezi acest răspuns?")) return;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, reported: 1 } : m)));
    await fetch(`/api/messages/${msg.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reported: true }),
    });
  };

  const readAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  // Only accept what we genuinely process: images (sent to the vision model)
  // and text files (contents inlined into the prompt).
  const onFiles = async (fileList) => {
    const files = Array.from(fileList);
    const out = [];
    let skipped = 0;
    for (const f of files) {
      const isImage = f.type.startsWith("image/");
      const isText =
        /^(text\/|application\/(json|xml))/.test(f.type) || /\.(txt|md|csv|json)$/i.test(f.name);
      if (isImage) {
        if (f.size > 6_000_000) { skipped++; continue; } // ~6MB cap
        try {
          const dataUrl = await readAsDataURL(f);
          out.push({ name: f.name, size: f.size, type: f.type, dataUrl });
        } catch { skipped++; }
      } else if (isText && f.size < 200_000) {
        try {
          out.push({ name: f.name, size: f.size, type: f.type, text: await f.text() });
        } catch { skipped++; }
      } else {
        skipped++; // unsupported (e.g. PDF/Word) — don't pretend we read it
      }
    }
    if (skipped) {
      setUploadNote(
        `${skipped} fișier(e) ignorat(e). Sunt acceptate imagini (max 6MB) și fișiere text (.txt, .md, .csv, .json).`
      );
      setTimeout(() => setUploadNote(""), 5000);
    }
    setAttachments((prev) => [...prev, ...out].slice(0, 5));
  };

  const visibleConversations = savedOnly ? conversations.filter((c) => c.saved) : conversations;
  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-ink-950">
      {/* ---------- Sidebar ---------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-ink-900/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/"><Logo /></Link>
          <button className="icon-btn lg:hidden" onClick={() => setSidebarOpen(false)}><IconX /></button>
        </div>

        <div className="px-3">
          <button onClick={newConversation} className="btn-primary w-full">
            <IconPlus /> Conversație nouă
          </button>
        </div>

        <div className="mt-4 flex items-center gap-1 px-4 text-xs font-medium text-slate-400">
          <button
            onClick={() => setSavedOnly(false)}
            className={`rounded-md px-2 py-1 ${!savedOnly ? "bg-white/10 text-white" : "hover:text-white"}`}
          >
            <span className="inline-flex items-center gap-1"><IconClock size={13} /> Istoric</span>
          </button>
          <button
            onClick={() => setSavedOnly(true)}
            className={`rounded-md px-2 py-1 ${savedOnly ? "bg-white/10 text-white" : "hover:text-white"}`}
          >
            <span className="inline-flex items-center gap-1"><IconStar size={13} /> Salvate</span>
          </button>
        </div>

        <div className="mt-2 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
          {user === null && (
            <p className="px-3 py-6 text-center text-xs text-slate-500">
              <Link href="/login" className="text-brand-400 underline">Autentifică-te</Link> pentru a salva și accesa istoricul conversațiilor.
            </p>
          )}
          {user && visibleConversations.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-slate-500">
              {savedOnly ? "Nicio conversație salvată." : "Nicio conversație încă."}
            </p>
          )}
          {visibleConversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-sm ${
                c.id === currentId ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <button onClick={() => openConversation(c.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                {c.saved ? <IconStar size={14} /> : <IconClock size={14} />}
                <span className="truncate">{c.title}</span>
              </button>
              <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                <button className="icon-btn h-7 w-7" title="Salvează" onClick={() => toggleSave(c.id, c.saved)}><IconStar size={14} /></button>
                <button className="icon-btn h-7 w-7" title="Redenumește" onClick={() => renameConversation(c.id, c.title)}><IconEdit size={14} /></button>
                <button className="icon-btn h-7 w-7" title="Șterge" onClick={() => deleteConversation(c.id)}><IconTrash size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2">
            <Link href="/account" className="btn-ghost flex-1 justify-start text-sm">
              <IconGear size={16} /> Setări
            </Link>
          </div>
          <Link href="/account" className="mt-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-white/5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-xs font-bold text-white">
              {(user?.name || user?.email || "?")[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{user ? user.name || user.email : "Vizitator"}</span>
              <span className="block text-xs text-slate-500">
                {user ? (user.plan === "premium" ? "Plan Premium" : "Plan Gratuit") : "Neautentificat"}
              </span>
            </span>
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ---------- Main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="icon-btn lg:hidden" onClick={() => setSidebarOpen(true)}><IconMenu /></button>
            <span className="text-sm font-medium text-slate-300">Asistent AI</span>
          </div>
          <div className="flex items-center gap-2">
            {user && user.plan !== "premium" && (
              <Link href="/pricing" className="btn-ghost text-xs">Treci la Premium</Link>
            )}
            {user === null && <Link href="/login" className="btn-primary text-xs">Autentificare</Link>}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {showWelcome ? (
              <Welcome onPick={(t) => setInput(t)} />
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <MessageBubble
                    key={m.id ?? i}
                    m={m}
                    idx={i}
                    copiedIdx={copiedIdx}
                    onCopy={copyMessage}
                    onRegenerate={regenerate}
                    onFeedback={sendFeedback}
                    onReport={reportMessage}
                    isLast={i === messages.length - 1}
                    streaming={streaming}
                    canFeedback={!!user}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-white/10 bg-ink-950/80 px-4 py-4">
          <div className="mx-auto max-w-3xl">
            {rateLimited && (
              <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
                Ai atins limita de mesaje.{" "}
                {user ? (
                  <Link href="/pricing" className="underline">Treci la Premium</Link>
                ) : (
                  <Link href="/register" className="underline">Creează un cont gratuit</Link>
                )}{" "}
                pentru a continua.
              </div>
            )}

            {uploadNote && (
              <div className="mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {uploadNote}
              </div>
            )}

            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-2 pr-3 text-xs text-slate-300">
                    {a.dataUrl ? (
                      <img src={a.dataUrl} alt={a.name} className="h-6 w-6 rounded object-cover" />
                    ) : (
                      <IconClip size={13} />
                    )}
                    <span className="max-w-[160px] truncate">{a.name}</span>
                    <button aria-label="Elimină fișierul" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                      <IconX size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="glass flex items-end gap-2 rounded-2xl p-2">
              <button
                className="icon-btn shrink-0"
                title="Încarcă imagini (analizate de AI) sau fișiere text"
                onClick={() => fileRef.current?.click()}
              >
                <IconClip />
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.txt,.md,.csv,.json"
                className="hidden"
                onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
              />
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Scrie aici întrebarea ta…"
                className="max-h-52 flex-1 resize-none bg-transparent px-1 py-2 text-slate-100 placeholder:text-slate-500 outline-none"
              />
              {streaming ? (
                <button onClick={stop} className="btn-ghost shrink-0 !px-3" title="Oprește generarea">
                  <IconStop /> <span className="hidden sm:inline">Oprește</span>
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim() && attachments.length === 0}
                  className="btn-primary shrink-0 !px-3"
                  title="Trimite"
                >
                  <IconSend />
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              DIMAX poate greși. Verifică informațiile importante. Răspunde în limba în care scrii (RO · EN · RU).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Welcome screen ----------
function Welcome({ onPick }) {
  return (
    <div className="animate-fadeup py-8 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 text-brand-400 animate-floaty">
        <IconBot size={30} />
      </div>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">{WELCOME}</h1>
      <p className="mx-auto mt-3 max-w-lg text-slate-400">
        Alege o categorie rapidă sau scrie direct întrebarea ta în caseta de mai jos.
      </p>
      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onPick(CATEGORY_PROMPTS[c])}
            className="glass rounded-xl px-4 py-4 text-sm font-medium text-slate-200 transition hover:border-brand-500/40 hover:text-white"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Message bubble ----------
function MessageBubble({ m, idx, copiedIdx, onCopy, onRegenerate, onFeedback, onReport, isLast, streaming, canFeedback }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser ? "bg-white/10 text-slate-200" : "bg-gradient-to-br from-brand-500 to-violet-500 text-white"
        }`}
      >
        {isUser ? <IconUser size={16} /> : <IconBot size={16} />}
      </div>

      <div className={`min-w-0 max-w-[85%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-left ${
            isUser ? "bg-brand-600/20 text-slate-100" : "glass"
          } ${m.error ? "border-red-500/30 bg-red-500/10 text-red-200" : ""}`}
        >
          {isUser ? (
            <>
              {m.images?.length > 0 && (
                <div className="mb-2 flex flex-wrap justify-end gap-2">
                  {m.images.map((src, k) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={k} src={src} alt="imagine atașată" className="max-h-40 rounded-lg border border-white/10" />
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
            </>
          ) : (
            <>
              <Markdown>{m.content}</Markdown>
              {m.streaming && !m.content && (
                <span className="inline-flex gap-1 py-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" />
                </span>
              )}
              {m.streaming && m.content && <span className="ml-0.5 inline-block h-4 w-1.5 animate-blink bg-brand-400 align-middle" />}
            </>
          )}
        </div>

        {/* action row for assistant messages */}
        {!isUser && !m.streaming && m.content && (
          <div className="mt-1.5 flex items-center gap-1 text-slate-500">
            <button className="icon-btn h-7 w-7" title="Copiază" onClick={() => onCopy(m.content, idx)}>
              {copiedIdx === idx ? <IconCheck size={15} /> : <IconCopy size={15} />}
            </button>
            {isLast && (
              <button className="icon-btn h-7 w-7" title="Regenerează" onClick={onRegenerate} disabled={streaming}>
                <IconRefresh size={15} />
              </button>
            )}
            {canFeedback && (
              <>
                <button
                  className={`icon-btn h-7 w-7 ${m.feedback === 1 ? "text-brand-400" : ""}`}
                  title="Răspuns util" onClick={() => onFeedback(m, 1)}
                ><IconUp size={15} /></button>
                <button
                  className={`icon-btn h-7 w-7 ${m.feedback === -1 ? "text-red-400" : ""}`}
                  title="Răspuns neutil" onClick={() => onFeedback(m, -1)}
                ><IconDown size={15} /></button>
                <button
                  className={`icon-btn h-7 w-7 ${m.reported ? "text-amber-400" : ""}`}
                  title="Raportează" onClick={() => onReport(m)}
                ><IconFlag size={15} /></button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
