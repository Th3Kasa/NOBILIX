import { getProject } from "@/config/projects";
import { ProjectSidebar } from "@/components/nav/project-sidebar";

export default function TrapManLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const project = getProject("trapman");

  return (
    <div className="flex min-h-dvh">
      <ProjectSidebar
        projectSlug={project.slug}
        projectName={project.name}
        modules={project.consoleModules}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 md:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
