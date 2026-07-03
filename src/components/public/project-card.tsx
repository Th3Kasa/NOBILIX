import Image from "next/image";
import type { ProjectDefinition } from "@/types/projects";

/**
 * Identity card only — no CTA here. The studio homepage already has an
 * "Enter TrapMan" action in the hero and a link below this card; a third
 * "Enter TrapMan" plus a "Player account" link on the same card were
 * redundant/out-of-place (studio home isn't the place to route toward
 * player login) and have been removed.
 */
export function ProjectCard({ project }: { project: ProjectDefinition }) {
  return (
    <article className="project-card">
      <Image
        src={project.logoPath}
        alt={`${project.name} logo`}
        width={112}
        height={112}
      />
      <p className="project-card__meta">
        <span className="project-card__status-dot" aria-hidden="true" />
        {project.kind} · {project.status}
      </p>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
    </article>
  );
}
