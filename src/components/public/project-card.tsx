import Image from "next/image";
import Link from "next/link";
import type { ProjectDefinition } from "@/types/projects";

export function ProjectCard({ project }: { project: ProjectDefinition }) {
  return (
    <article className="project-card">
      <Image
        src={project.logoPath}
        alt={`${project.name} logo`}
        width={112}
        height={112}
      />
      <p>
        {project.kind} · {project.status}
      </p>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <div className="project-card__actions">
        <Link href={project.publicPath}>Enter {project.name}</Link>
        {project.accountPath && <Link href={project.accountPath}>Player account</Link>}
      </div>
    </article>
  );
}
