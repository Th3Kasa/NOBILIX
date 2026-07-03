import { PROJECTS } from "@/config/projects";
import { ProjectTile } from "@/components/console/project-tile";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

// NOTE (Part B, item 4): this page renders a static list of project tiles
// sourced from the PROJECTS config — there is no live/time-sensitive data
// here (no Firestore reads, no timestamps), so AutoRefresh is intentionally
// omitted. Every module inside a project's own console (e.g. /console/trapman
// and its pages) already carries AutoRefresh via trapman/layout.tsx.
export default function ConsolePage() {
  const projects = Object.values(PROJECTS);

  return (
    <main id="main-content" tabIndex={-1}>
      <PageHeader
        title="Projects"
        description="Select a project to open its mission-control workspace."
      />

      <div className="console-page-grid">
        {projects.map((project) => (
          <div key={project.slug} className="console-grid-span-4">
            <ProjectTile project={project} />
          </div>
        ))}
      </div>
    </main>
  );
}
