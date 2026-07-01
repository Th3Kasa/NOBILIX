import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PROJECTS } from "@/config/projects";
import { ProjectCard } from "@/components/public/project-card";

export function ProjectShowcase() {
  const mainProject = PROJECTS.trapman;

  return (
    <section id="projects" className="project-showcase" aria-labelledby="projects-title">
      <Reveal className="project-showcase__media" aria-hidden="true">
        <Image
          src="/assets/generated/nobilix/project-transition.webp"
          alt=""
          width={1440}
          height={900}
          sizes="(max-width: 900px) 100vw, 44vw"
        />
      </Reveal>
      <Reveal delay={0.1} className="project-showcase__copy">
        <p className="eyebrow">02 / Main project</p>
        <h2 id="projects-title">
          TrapMan is the <em>main project</em> currently.
        </h2>
        <p>
          The portfolio starts with one real project instead of invented tiles.
          More worlds are being shaped, and the system is ready when they are.
        </p>
        <ProjectCard project={mainProject} />
        <Link className="nobilix-text-link" href="/trapman">
          Enter the TrapMan project
        </Link>
      </Reveal>
    </section>
  );
}
