import { getProject } from "@/config/projects";
import { ConsoleMobileNav } from "@/components/nav/console-mobile-nav";
import { ProjectSidebar, MODULE_META } from "@/components/nav/project-sidebar";
import { AutoRefresh } from "@/components/console/auto-refresh";

export default function TrapManLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const project = getProject("trapman");
  const projectNavigationItems = project.consoleModules.map((module) => {
    const label = MODULE_META[module]?.label ?? module;
    return {
      href: module === "overview" ? "/console/trapman" : `/console/trapman/${module}`,
      label,
      description: `${project.name} ${label}`,
    };
  });

  return (
    <div className="console-shell flex min-h-dvh">
      <div className="console-grid-mesh" aria-hidden="true" />
      <ProjectSidebar
        projectSlug={project.slug}
        projectName={project.name}
        modules={project.consoleModules}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border bg-card/40 px-4 py-3 md:hidden">
          <ConsoleMobileNav scopeLabel={project.name} items={projectNavigationItems} />
        </div>
        <div className="flex h-10 items-center justify-end border-b border-border/60 bg-card/20 px-4 md:px-6">
          <AutoRefresh />
        </div>
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
