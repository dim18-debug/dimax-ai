# Publicare online (Vercel + Turso) — gratuit

Ghid pas cu pas ca alți oameni să poată folosi DIMAX AI la o adresă publică (ex. `https://dimax.vercel.app`). Nu e nevoie de card. Timp estimat: ~15 minute.

Ai nevoie de 3 conturi gratuite: **Turso** (baza de date), **Vercel** (găzduire) și opțional **GitHub**.

---

## 1. Creează baza de date (Turso)

1. Intră pe **https://turso.tech** și fă un cont gratuit.
2. Creează o bază de date nouă (buton **Create Database**), nume ex. `dimax`.
3. Deschide baza → secțiunea de conectare și notează:
   - **Database URL** — începe cu `libsql://...`
   - **Auth Token** — un șir lung (buton *Create Token* / *Generate Token*).

> Alternativ, din terminal (Turso CLI):
> ```bash
> curl -sSfL https://get.tur.so/install.sh | bash
> turso auth signup
> turso db create dimax
> turso db show dimax --url           # → TURSO_DATABASE_URL
> turso db tokens create dimax        # → TURSO_AUTH_TOKEN
> ```

Nu trebuie să creezi tabele manual — aplicația le creează singură la prima pornire.

---

## 2. Pune codul pe Vercel

Cea mai simplă cale (fără GitHub), din folderul proiectului:

```bash
cd smartai-assistant
npx vercel
```

- Prima dată îți cere să te loghezi (se deschide browserul) → creezi cont Vercel gratuit.
- Răspunde la întrebări cu valorile implicite (Enter). La final primești un link de preview.
- Pentru varianta finală publică: `npx vercel --prod`.

> Alternativ, prin GitHub: pune proiectul pe GitHub, apoi pe **vercel.com → Add New → Project → Import** repo-ul. Vercel detectează automat Next.js.

---

## 3. Setează variabilele de mediu în Vercel

În **Vercel → proiectul tău → Settings → Environment Variables**, adaugă (pentru mediul *Production*):

| Variabilă | Valoare |
|---|---|
| `TURSO_DATABASE_URL` | URL-ul `libsql://...` de la Turso |
| `TURSO_AUTH_TOKEN` | token-ul de la Turso |
| `OPENAI_API_KEY` | cheia ta (ex. Groq `gsk_...`) |
| `OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` (pentru Groq) |
| `OPENAI_MODEL` | `llama-3.3-70b-versatile` (sau alt model) |
| `AUTH_SECRET` | un șir lung și aleatoriu (vezi mai jos) |
| `ADMIN_EMAIL` | emailul tău de admin (ex. `admin@dimax.app`) |
| `APP_BASE_URL` | adresa publică, ex. `https://dimax.vercel.app` |
| `GUEST_DAILY_LIMIT` | `5` |
| `FREE_DAILY_LIMIT` | `20` |
| `PREMIUM_DAILY_LIMIT` | `500` |

Generează un `AUTH_SECRET` sigur:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

După ce adaugi variabilele, apasă **Redeploy** (Deployments → … → Redeploy) ca să fie preluate.

---

## 4. Creează contul de administrator

Pe site-ul publicat, mergi la `/register` și înregistrează-te cu **exact** emailul pus în `ADMIN_EMAIL`. Contul devine automat administrator → ai acces la `/admin`.

(Opțional, dacă preferi să semiezi din terminal: `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run seed`.)

---

## 5. Gata — trimite linkul

Adresa `https://...vercel.app` poate fi folosită de oricine. Fiecare vizitator are limita zilnică de mesaje; conturile create au istoric propriu.

### Recomandări
- 🔐 Rotește cheile care au fost expuse în chat (Groq, OpenAI).
- 🌐 Poți lega un domeniu propriu în **Vercel → Settings → Domains** (și actualizează `APP_BASE_URL`).
- 🔵 Pentru login Google/Apple în producție, adaugă credențialele (vezi `.env.example`) și setează redirect URI-urile pe `https://domeniul-tău/api/auth/google/callback` și `/api/auth/apple/callback`.
