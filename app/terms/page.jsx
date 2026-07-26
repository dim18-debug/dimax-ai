export const dynamic = "force-dynamic";
import PageShell from "@/components/PageShell";

export const metadata = { title: "Termeni și condiții — DIMAX AI" };

export default function TermsPage() {
  return (
    <PageShell title="Termeni și condiții" subtitle="Ultima actualizare: conținut demonstrativ, editabil ulterior.">
      <div className="prose-ai space-y-4">
        <h2>1. Acceptarea termenilor</h2>
        <p>Prin utilizarea DIMAX AI, ești de acord cu acești termeni. Dacă nu ești de acord, te rugăm să nu folosești platforma.</p>
        <h2>2. Descrierea serviciului</h2>
        <p>DIMAX AI oferă un asistent conversațional bazat pe inteligență artificială. Răspunsurile sunt generate automat și pot conține erori; verifică informațiile importante.</p>
        <h2>3. Conturi și utilizare</h2>
        <p>Ești responsabil pentru păstrarea confidențialității contului tău. Utilizarea excesivă sau abuzivă poate duce la limitarea sau blocarea accesului.</p>
        <h2>4. Conținut interzis</h2>
        <p>Nu folosi platforma pentru a genera conținut ilegal, periculos sau care încalcă drepturile altor persoane.</p>
        <h2>5. Planuri și plăți</h2>
        <p>Planurile Gratuit și Premium sunt descrise pe pagina de abonamente. Prețurile pot fi modificate cu notificare prealabilă.</p>
        <h2>6. Limitarea răspunderii</h2>
        <p>Serviciul este oferit „ca atare”. Nu ne asumăm răspunderea pentru deciziile luate pe baza răspunsurilor generate.</p>
        <h2>7. Modificări</h2>
        <p>Putem actualiza acești termeni. Versiunea curentă este întotdeauna disponibilă pe această pagină.</p>
      </div>
    </PageShell>
  );
}
