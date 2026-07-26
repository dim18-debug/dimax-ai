export const dynamic = "force-dynamic";
import PageShell from "@/components/PageShell";

export const metadata = { title: "Politica de confidențialitate — DIMAX AI" };

export default function PrivacyPage() {
  return (
    <PageShell title="Politica de confidențialitate" subtitle="Cum colectăm, folosim și protejăm datele tale.">
      <div className="prose-ai space-y-4">
        <h2>Ce date colectăm</h2>
        <p>Colectăm datele de cont (email, nume opțional) și conținutul conversațiilor tale, pentru a-ți oferi istoricul și funcțiile platformei.</p>
        <h2>Cum folosim datele</h2>
        <p>Folosim datele pentru a genera răspunsuri, a-ți salva conversațiile și a îmbunătăți serviciul. Nu vindem datele tale personale.</p>
        <h2>Securitatea cheii API</h2>
        <p>Cheia API pentru modelul de inteligență artificială este păstrată exclusiv pe server, într-o variabilă de mediu, și nu este niciodată expusă în browser.</p>
        <h2>Controlul asupra datelor</h2>
        <p>Poți oricând să îți ștergi conversațiile sau întregul cont din pagina <strong>Contul meu</strong>. Ștergerea contului elimină definitiv datele asociate.</p>
        <h2>Stocare</h2>
        <p>Datele sunt stocate într-o bază de date securizată. Aplicarea de măsuri suplimentare de securitate este recomandată în producție.</p>
        <h2>Contact</h2>
        <p>Pentru orice întrebare privind confidențialitatea, folosește pagina de contact.</p>
      </div>
    </PageShell>
  );
}
