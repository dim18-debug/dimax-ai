export const dynamic = "force-dynamic";
import PageShell from "@/components/PageShell";
import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact — DIMAX AI" };

export default function ContactPage() {
  return (
    <PageShell title="Contact" subtitle="Ai o întrebare sau o sugestie? Scrie-ne și îți răspundem cât mai curând.">
      <ContactForm />
    </PageShell>
  );
}
