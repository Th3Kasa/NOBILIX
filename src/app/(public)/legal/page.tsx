import Link from "next/link";
import { PROJECTS } from "@/config/projects";

export default function LegalDirectoryPage() {
  const project = PROJECTS.trapman;
  return (
    <section className="legal-directory legal-reading" aria-labelledby="company-legal-title">
      <p className="eyebrow">
        <span className="eyebrow__dot" aria-hidden="true" />
        Company brand
      </p>
      <h1 id="company-legal-title">Legal and product policies</h1>
      <p>
        Nobilix Pty Ltd is the company. Each product keeps its own terms,
        privacy notice, and account controls — grouped below by the product
        they apply to.
      </p>

      <div className="legal-directory__grid">
        <article className="magnetic-hover">
          <p>Corporate notices</p>
          <h2>Nobilix Pty Ltd</h2>
          <p>
            Studio-level notices cover Nobilix as the company, portfolio owner,
            and console operator in New South Wales, Australia.
          </p>
          <Link href="/legal/privacy-policy">Privacy Policy</Link>
          <Link href="/legal/terms-of-use">Terms of Use</Link>
        </article>
        <article className="magnetic-hover">
          <p>Product policies</p>
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
