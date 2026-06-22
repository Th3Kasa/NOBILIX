import type { Metadata } from "next";
import { ProjectCard } from "@/components/public/project-card";
import { PROJECTS } from "@/config/projects";

export const metadata: Metadata = {
  title: "Independent digital worlds",
  description: "Nobilix builds games and digital products with distinct identities.",
  alternates: { canonical: "/" },
};

export default function NobilixHomePage() {
  return (
    <>
      <section className="nobilix-hero">
        <p>Independent studio · Sydney</p>
        <h1>Build worlds. Read signals.</h1>
        <p>Distinctive products, built as complete identities.</p>
      </section>
      <section id="projects" className="nobilix-projects" aria-labelledby="projects-title">
        <h2 id="projects-title">Current projects</h2>
        <ProjectCard project={PROJECTS.trapman} />
      </section>
    </>
  );
}
