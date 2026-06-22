import Image from "next/image";
import Link from "next/link";
import type { ProjectDefinition } from "@/types/projects";

export function ProjectCard({ project }: { project: ProjectDefinition }) {
  return (
    <article className="project-card">
      <Image src={project.logoPath} alt="" width={112} height={112} />
      <p>{project.kind} · {project.status}</p>
      <h2>{project.name}</h2>
      <p>{project.description}</p>
      <Link href={project.publicPath}>Enter {project.name}</Link>
    </article>
  );
}
