import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PROJECTS } from "@/config/projects";
import { ProjectCard } from "@/components/public/project-card";

export function ProjectShowcase() {
  const mainProject = PROJECTS.trapman;

  return (
    <section id="projects" className="project-showcase" aria-labelledby="projects-title">
      <Reveal className="project-showcase__media neon-border" aria-hidden="true">
        <Image
          src="/assets/generated/nobilix/project-transition.webp"
          alt=""
          width={1440}
          height={900}
          sizes="(max-width: 900px) 100vw, 44vw"
        />
      </Reveal>
      <Reveal delay={0.1} className="project-showcase__copy">
        <p className="eyebrow">
          <span className="eyebrow__dot" aria-hidden="true" />
          02 / Main project
        </p>
        <h2 id="projects-title">
          TrapMan is where Nobilix is <em>focused right now</em>.
        </h2>
        <p>
          The portfolio starts with one real product, not a wall of
          placeholders. More are being built — and this page is ready to hold
          them.
        </p>
        <ProjectCard project={mainProject} />
        <Link className="nobilix-text-link magnetic-hover" href={mainProject.publicPath}>
          See what&apos;s inside TrapMan →
        </Link>
      </Reveal>
    </section>
  );
}
