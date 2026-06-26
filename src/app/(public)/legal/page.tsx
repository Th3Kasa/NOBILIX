import Link from "next/link";
import { PROJECTS } from "@/config/projects";

export default function LegalDirectoryPage() {
  const project = PROJECTS.trapman;
  return (
    <section className="legal-directory legal-reading" aria-labelledby="company-legal-title">
      <p className="eyebrow">Company brand</p>
      <h1 id="company-legal-title">Legal and project policies</h1>
      <p>
        Nobilix is the company brand. Project-specific terms, privacy notices,
        data disclosures, and account deletion instructions live with the
        project they govern.
      </p>

      <div className="legal-directory__grid">
        <article>
          <p>Corporate notices</p>
          <h2>Nobilix Pty Ltd</h2>
          <p>
            Studio-level notices cover Nobilix as the company, portfolio owner,
            and console operator in New South Wales, Australia.
          </p>
          <Link href="/legal">Company legal directory</Link>
        </article>
        <article>
          <p>Project policies</p>
          <h2>{project.name}</h2>
          <Link href={project.legal.privacy}>Privacy Policy</Link>
          <Link href={project.legal.terms}>Terms of Use</Link>
          <Link href={project.legal.compliance}>Data &amp; Compliance</Link>
          <Link href={project.legal.deletion}>Delete Account</Link>
        </article>
      </div>
    </section>
  );
}
