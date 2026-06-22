import { PROJECTS } from "@/config/projects";
import { ProjectTile } from "@/components/console/project-tile";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default function ConsolePage() {
  const projects = Object.values(PROJECTS);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Select a project to open its mission-control workspace."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectTile key={project.slug} project={project} />
        ))}
      </div>
    </>
  );
}
