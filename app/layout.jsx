import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "DIMAX AI — Întreabă orice. Primește răspunsul în câteva secunde.",
  description:
    "Asistentul tău inteligent pentru informații, idei, explicații, traduceri și ajutor în activitățile de zi cu zi.",
};

export default function RootLayout({ children }) {
  let theme = "dark";
  try {
    // Allows a default theme to be configured later; users override client-side.
  } catch {}
  return (
    <html lang="ro" className={theme === "light" ? "light" : ""} suppressHydrationWarning>
      <body>
        <script
          // Respect a saved theme before paint to avoid a flash.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('smartai-theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}`,
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
