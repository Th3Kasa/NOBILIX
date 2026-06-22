import type { Metadata } from "next";
import { LegalShell } from "@/app/(public)/trapman/_legal/legal-shell";
import { TERMS_SECTIONS, TERMS_LAST_UPDATED } from "@/content/trapman/terms";

export const metadata: Metadata = {
  title: "Terms of Use — TrapMan",
  description:
    "Terms and conditions for playing TrapMan, Nobilix's mobile game.",
  alternates: { canonical: "/trapman/terms-of-use" },
};

export default function TrapManTermsPage() {
  return (
    <LegalShell title="Terms of Use" lastUpdated={TERMS_LAST_UPDATED}>
      {Object.values(TERMS_SECTIONS).map((section) => (
        <section
          key={section.heading}
          id={section.heading.toLowerCase().replace(/\s+/g, "-")}
        >
          <h2>{section.heading}</h2>
          <p style={{ whiteSpace: "pre-line" }}>{section.body}</p>
        </section>
      ))}
    </LegalShell>
  );
}
