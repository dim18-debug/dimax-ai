export const dynamic = "force-dynamic";
import PageShell from "@/components/PageShell";

export const metadata = { title: "Politica privind cookie-urile — DIMAX AI" };

export default function CookiesPage() {
  return (
    <PageShell title="Politica privind cookie-urile" subtitle="Ce cookie-uri folosim și de ce.">
      <div className="prose-ai space-y-4">
        <h2>Ce sunt cookie-urile</h2>
        <p>Cookie-urile sunt fișiere mici stocate în browser, care ne ajută să menținem sesiunea și preferințele tale.</p>
        <h2>Cookie-uri esențiale</h2>
        <p>Folosim un cookie de sesiune securizat (<code>smartai_session</code>) pentru a te menține autentificat. Acesta este necesar pentru funcționarea platformei.</p>
        <h2>Preferințe</h2>
        <p>Salvăm local tema aleasă (deschisă/întunecată) pentru a-ți oferi o experiență consistentă.</p>
        <h2>Fără urmărire în scop publicitar</h2>
        <p>Nu folosim cookie-uri de urmărire pentru publicitate în acest build demonstrativ.</p>
      </div>
    </PageShell>
  );
}
