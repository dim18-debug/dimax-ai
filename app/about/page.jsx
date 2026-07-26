export const dynamic = "force-dynamic";
import PageShell from "@/components/PageShell";

export const metadata = { title: "Despre platformă — DIMAX AI" };

export default function AboutPage() {
  return (
    <PageShell
      title="Despre platformă"
      subtitle="DIMAX AI este un asistent conversațional bazat pe inteligență artificială, gândit pentru publicul larg."
    >
      <div className="prose-ai space-y-6">
        <p>
          <strong>DIMAX AI</strong> te ajută să obții răspunsuri clare, rapide și bine structurate la
          orice întrebare. Poți cere explicații, poți crea texte, poți traduce, poți genera idei și poți primi
          ajutor în activitățile de zi cu zi — totul într-o interfață modernă și ușor de folosit.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="glass rounded-2xl p-5">
              <h3 className="text-base font-semibold text-white">{v.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{v.desc}</p>
            </div>
          ))}
        </div>

        <h2>Misiunea noastră</h2>
        <p>
          Ne dorim ca inteligența artificială să fie accesibilă tuturor, indiferent de nivelul tehnic. De aceea
          am construit o platformă simplă, sigură și multilingvă (română, engleză și rusă), în care poți începe
          o conversație în câteva secunde.
        </p>

        <h2>Confidențialitate și siguranță</h2>
        <p>
          Cheia API rămâne întotdeauna pe server și nu este niciodată expusă în browser. Îți poți șterge oricând
          conversațiile sau contul din pagina de setări.
        </p>
      </div>
    </PageShell>
  );
}

const VALUES = [
  { title: "Rapid și clar", desc: "Răspunsuri afișate în timp real, structurate cu titluri, liste și cod." },
  { title: "Multilingv", desc: "Răspunde automat în limba în care scrii: română, engleză sau rusă." },
  { title: "Sigur", desc: "Fără expunerea cheii API, cu control complet asupra datelor tale." },
  { title: "Pentru orice domeniu", desc: "De la scriere și traduceri, până la afaceri, educație și tehnologie." },
];
