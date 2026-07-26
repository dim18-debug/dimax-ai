# DIMAX AI

Asistent conversațional premium bazat pe inteligență artificială — Next.js (App Router) + backend securizat + bază de date SQLite. Design modern, întunecat, responsive, cu chat în timp real, autentificare, istoric de conversații, planuri de abonament și panou de administrare.

## ✨ Funcționalități

- **Chat AI în timp real** — răspunsuri afișate treptat (streaming), formatate cu titluri, liste și cod.
- **Backend securizat** — cheia `OPENAI_API_KEY` rămâne doar pe server, niciodată expusă în browser.
- **Multilingv** — asistentul răspunde în limba în care scrii (RO · EN · RU).
- **Autentificare** — email + parolă (parole hash-uite cu bcrypt, sesiuni JWT httpOnly) și **login real Google + Apple (OAuth)**. Butoanele social apar doar când furnizorul e configurat.
- **Conversații** — creare, salvare, redenumire, ștergere, istoric.
- **Butoane pe mesaje** — copiere, regenerare, apreciere/neapreciere, raportare, oprirea generării.
- **Încărcare fișiere** — imagini analizate real de modelul de viziune + fișiere text (.txt/.md/.csv/.json) al căror conținut e trimis modelului.
- **Planuri** — Gratuit și Premium. Trecerea la Premium se face prin **cerere reală**, aprobată din panoul de administrare.
- **Panou de administrare** — statistici, utilizatori (blocare/plan), rapoarte, erori, mesaje de contact, editare setări/prețuri/anunțuri/FAQ și system prompt.
- **Rate limiting** — limită zilnică pentru vizitatori și utilizatori.
- **Control asupra datelor** — ștergerea conversațiilor și a contului.

## 🚀 Pornire rapidă

```bash
npm install
cp .env.example .env.local   # completează valorile (vezi mai jos)
npm run seed                 # creează contul de admin
npm run dev                  # http://localhost:3000
```

Fără `OPENAI_API_KEY`, chatul afișează o eroare onestă (fără răspuns simulat). Pentru răspunsuri reale, adaugă o cheie (OpenAI cu credit, sau un furnizor compatibil precum Groq).

**Publicare online:** vezi [`DEPLOY.md`](DEPLOY.md) (Vercel + Turso, gratuit).

### Variabile de mediu (`.env.local`)

| Variabilă | Descriere |
|---|---|
| `OPENAI_API_KEY` | Cheia API (OpenAI-compatibilă, ex. Groq). Fără ea chatul dă eroare onestă. |
| `OPENAI_MODEL` | Modelul folosit (ex. `gpt-4o-mini`, `llama-3.3-70b-versatile`). |
| `OPENAI_BASE_URL` | Endpoint API (permite furnizori compatibili, ex. Groq). |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Baza de date în cloud (producție). Local se lasă gol → fișier SQLite. |
| `AUTH_SECRET` | Secret pentru semnarea sesiunilor JWT. |
| `ADMIN_EMAIL` | Emailul care primește automat rol de admin la înregistrare. |
| `APP_BASE_URL` | Adresa publică (pentru redirect-urile OAuth în producție). |
| `GUEST_DAILY_LIMIT` / `FREE_DAILY_LIMIT` / `PREMIUM_DAILY_LIMIT` | Limite zilnice de mesaje. |

### Cont de administrare

`npm run seed` creează `admin@smartai.local` / `admin123` (configurabil prin `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
Autentifică-te la `/login`, apoi accesează `/admin`. Alternativ, orice cont înregistrat cu emailul din `ADMIN_EMAIL` devine automat admin.

## 🧱 Structura proiectului

```
app/                 Pagini (App Router) + rute API
  api/               chat (streaming), auth, conversations, admin, contact, subscribe...
  chat/              interfața de chat
  admin/             panoul de administrare
  (pagini)           acasă, about, faq, contact, pricing, terms, privacy, cookies, account
components/          UI (Navbar, Footer, chat, admin, forms...)
lib/                 db (SQLite), auth, ai (streaming), usage (rate limit), config
data/                baza de date SQLite (creată automat)
scripts/seed.mjs     creare cont admin
```

## 🔧 Personalizare

Textele, logo-ul, culorile și prețurile sunt ușor de schimbat:

- **Culori/temă** → `tailwind.config.js` (paleta `brand`, `ink`, `violet`).
- **Texte implicite, FAQ, prețuri, system prompt** → `lib/config.js` (sau direct din **/admin**, fără cod).
- **Logo** → `components/Logo.jsx`.

## 🔒 Securitate

- Cheia API doar pe server; rutele admin protejate prin verificarea rolului.
- Parole hash-uite (bcrypt), sesiuni JWT httpOnly.
- Validarea datelor de intrare și limitarea numărului de solicitări.
- Ștergerea completă a datelor utilizatorului la cerere.

## 📦 Tehnologii

Next.js 14 · React 18 · Tailwind CSS · @libsql/client (SQLite local / Turso în cloud) · jose (JWT) · bcryptjs · react-markdown.

### Note

- **Chat AI**: fără mod simulat. Fără `OPENAI_API_KEY`, chatul returnează o eroare onestă; cu cheie, generează răspunsuri reale în timp real (inclusiv analiză de imagini dacă modelul suportă viziune).
- **Login social**: fluxuri OAuth **reale** pentru Google și Apple, activate când sunt setate credențialele (vezi `.env.example`). Fără credențiale, butoanele nu apar deloc — nimic decorativ.
- **Premium**: fără plată simulată. Utilizatorul trimite o cerere reală, iar administratorul o aprobă din panou (efect real asupra planului și limitelor). Poate fi înlocuit oricând cu Stripe.
- Baza de date (SQLite) poate fi migrată la Supabase/Firebase/Postgres păstrând aceeași structură.
