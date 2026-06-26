import { getProject } from "@/config/projects";
import { ConsoleMobileNav } from "@/components/nav/console-mobile-nav";
import { ProjectSidebar } from "@/components/nav/project-sidebar";

const moduleLabels: Record<string, string> = {
  overview: "Overview",
  users: "Players",
  leaderboard: "Leaderboard",
  messaging: "Messaging",
  analytics: "Analytics",
  purchases: "Purchases",
  gameplay: "Gameplay",
  ads: "Ads",
  exports: "Exports",
  audit: "Audit",
  settings: "Settings",
};

export default function TrapManLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const project = getProject("trapman");
  const projectNavigationItems = project.consoleModules.map((module) => ({
    href: module === "overview" ? "/console/trapman" : `/console/trapman/${module}`,
    label: moduleLabels[module],
    description: `${project.name} ${moduleLabels[module]}`,
  }));

  return (
    <div className="flex min-h-dvh">
      <ProjectSidebar
        projectSlug={project.slug}
        projectName={project.name}
        modules={project.consoleModules}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border bg-card/40 px-4 py-3 md:hidden">
          <ConsoleMobileNav scopeLabel={project.name} items={projectNavigationItems} />
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
