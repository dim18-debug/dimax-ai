import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-950/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-400">
            Asistentul tău inteligent pentru informații, idei, explicații, traduceri și ajutor zilnic.
          </p>
        </div>

        <FooterCol
          title="Platformă"
          links={[
            ["Asistent AI", "/chat"],
            ["Despre platformă", "/about"],
            ["Abonamente", "/pricing"],
            ["Întrebări frecvente", "/faq"],
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            ["Termeni și condiții", "/terms"],
            ["Politica de confidențialitate", "/privacy"],
            ["Politica privind cookie-urile", "/cookies"],
            ["Contact", "/contact"],
          ]}
        />
        <FooterCol
          title="Cont"
          links={[
            ["Autentificare", "/login"],
            ["Creează cont", "/register"],
            ["Contul meu", "/account"],
          ]}
        />
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
        © {new Date().getFullYear()} DIMAX AI. Toate drepturile rezervate.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-slate-400 transition hover:text-brand-400">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
