import { getSetting } from "./db";

// Default, editable content. Everything here can be overridden from the
// admin panel (stored in the `settings` table) so texts, prices, FAQ and
// the AI system prompt can change without touching the code.

export const DEFAULTS = {
  brand: {
    name: "DIMAX AI",
    tagline: "Întreabă orice. Primește răspunsul în câteva secunde.",
    subtitle:
      "Asistentul tău inteligent pentru informații, idei, explicații, traduceri și ajutor în activitățile de zi cu zi.",
  },
  systemPrompt:
    "Ești un asistent inteligent, util și prietenos. Răspunde clar, corect și pe înțelesul utilizatorului. " +
    "REGULĂ IMPORTANTĂ DESPRE LIMBĂ: răspunde ÎNTOTDEAUNA exact în aceeași limbă în care este scris ultimul mesaj al utilizatorului. " +
    "Dacă scrie în engleză, răspunde în engleză; dacă scrie în rusă, răspunde în rusă; dacă scrie în română, răspunde în română. " +
    "(Language rule: ALWAYS reply in the exact same language as the user's last message — English → English, Russian → Russian, Romanian → Romanian.) " +
    "Pentru întrebările simple, oferă răspunsuri directe. Pentru întrebările complexe, structurează informația în pași clari, cu titluri, paragrafe, liste și blocuri de cod atunci când este util. " +
    "Nu inventa informații atunci când nu cunoști răspunsul. Spune sincer când o informație trebuie verificată. " +
    "Nu oferi instrucțiuni periculoase, ilegale sau care pot provoca daune.",
  limits: {
    guest: Number(process.env.GUEST_DAILY_LIMIT || 5),
    free: Number(process.env.FREE_DAILY_LIMIT || 20),
    premium: Number(process.env.PREMIUM_DAILY_LIMIT || 500),
  },
  prices: {
    free: { label: "Gratuit", price: 0, currency: "EUR", period: "lună" },
    premium: { label: "Premium", price: 9.99, currency: "EUR", period: "lună" },
  },
  announcement: "",
  faqs: [
    {
      q: "Ce este DIMAX AI?",
      a: "Este un asistent conversațional bazat pe inteligență artificială care răspunde la întrebări, explică subiecte, creează texte, traduce și te ajută în activitățile de zi cu zi.",
    },
    {
      q: "Am nevoie de cont pentru a-l folosi?",
      a: "Poți trimite câteva mesaje și fără cont. Pentru a salva conversațiile, a accesa istoricul complet și a folosi funcțiile avansate, îți recomandăm să îți creezi un cont gratuit.",
    },
    {
      q: "În ce limbi răspunde asistentul?",
      a: "Asistentul răspunde în aceeași limbă în care scrii. Limbile principale ale platformei sunt româna, engleza și rusa.",
    },
    {
      q: "Datele mele sunt în siguranță?",
      a: "Cheia API este păstrată doar pe server și nu este niciodată expusă în browser. Îți poți șterge oricând conversațiile și contul din setări.",
    },
    {
      q: "Care este diferența dintre planul Gratuit și Premium?",
      a: "Planul Gratuit oferă un număr limitat de întrebări pe zi și istoric limitat. Planul Premium oferă mai multe întrebări, răspunsuri prioritare, istoric complet și încărcarea documentelor.",
    },
  ],
  quickCategories: [
    "Scriere și traducere",
    "Afaceri și marketing",
    "Educație",
    "Tehnologie",
    "Călătorii",
    "Idei și creativitate",
  ],
  exampleQuestions: [
    "Ajută-mă să scriu un email profesional.",
    "Explică-mi un subiect complicat într-un mod simplu.",
    "Creează-mi un plan de afaceri.",
    "Tradu acest text în engleză.",
    "Recomandă-mi idei pentru o vacanță.",
  ],
};

export async function getConfig() {
  const [brand, systemPrompt, limits, prices, announcement, faqs] = await Promise.all([
    getSetting("brand", DEFAULTS.brand),
    getSetting("systemPrompt", DEFAULTS.systemPrompt),
    getSetting("limits", DEFAULTS.limits),
    getSetting("prices", DEFAULTS.prices),
    getSetting("announcement", DEFAULTS.announcement),
    getSetting("faqs", DEFAULTS.faqs),
  ]);
  return {
    brand,
    systemPrompt,
    limits,
    prices,
    announcement,
    faqs,
    quickCategories: DEFAULTS.quickCategories,
    exampleQuestions: DEFAULTS.exampleQuestions,
  };
}
