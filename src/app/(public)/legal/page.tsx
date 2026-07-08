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
        Nobilix Pty Ltd is the company behind our products. Each product keeps
        its own terms, privacy notice, and account controls — grouped below by
        product.
      </p>

      <div className="legal-directory__grid">
        <article className="magnetic-hover">
          <p>Corporate notices</p>
          <h2>Nobilix Pty Ltd</h2>
          <p>
            These notices cover Nobilix Pty Ltd itself — the company behind
            the portfolio, registered in New South Wales, Australia.
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
        </article>
      </div>
    </section>
  );
}
