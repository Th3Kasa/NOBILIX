import Link from "next/link";
import { PROJECTS } from "@/config/projects";

export default function LegalDirectoryPage() {
  const project = PROJECTS.trapman;
  return (
    <section className="legal-directory">
      <p>Nobilix company legal</p>
      <h1>Legal and project policies</h1>
      <p>Each Nobilix project maintains its own product-specific terms and data disclosures.</p>
      <article>
        <h2>{project.name}</h2>
        <Link href={project.legal.privacy}>Privacy Policy</Link>
        <Link href={project.legal.terms}>Terms of Use</Link>
        <Link href={project.legal.compliance}>Data &amp; Compliance</Link>
        <Link href={project.legal.deletion}>Delete Account</Link>
      </article>
    </section>
  );
}
