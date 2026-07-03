import Link from "next/link";
import { ArrowRight, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectTileLogo } from "@/components/console/project-tile-logo";
import { cn } from "@/lib/utils";
import type { ProjectDefinition } from "@/types/projects";

const STATUS_LABELS: Record<ProjectDefinition["status"], string> = {
  live: "Live",
  development: "In development",
  planned: "Planned",
};

const STATUS_CLASSES: Record<ProjectDefinition["status"], string> = {
  live: "border-[var(--console-live-border)] bg-[var(--console-live-tint)] text-[var(--console-live)]",
  development:
    "border-[var(--console-violet-border)] bg-[var(--console-violet-tint)] text-[var(--console-violet)]",
  planned: "border-border bg-muted/40 text-muted-foreground",
};

const STATUS_GLOW: Record<ProjectDefinition["status"], string> = {
  live: "drop-shadow-[0_0_4px_var(--console-live)]",
  development: "drop-shadow-[0_0_4px_var(--console-violet)]",
  planned: "",
};

export function ProjectTile({ project }: { project: ProjectDefinition }) {
  const consoleHref = `/console/${project.slug}`;

  return (
    <Card className="console-project-tile console-glass group relative h-full overflow-hidden transition-transform duration-150 hover:-translate-y-0.5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--neon-violet)_7%,transparent),transparent_55%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      <CardContent className="relative flex h-full flex-col gap-4 p-6">
        {/* Header: logo + name + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card/80">
              <ProjectTileLogo
                src={project.logoPath}
                alt={`${project.name} logo`}
              />
            </div>
            <div>
              <p className="font-semibold leading-tight">{project.name}</p>
              <p className="console-pixel-label text-muted-foreground">
                {project.kind}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide",
              STATUS_CLASSES[project.status],
            )}
          >
            <Circle
              className={cn("size-1.5 fill-current", STATUS_GLOW[project.status])}
              aria-hidden="true"
            />
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        {/* Module count + CTA */}
        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
          <span className="console-telemetry text-xs text-muted-foreground">
            {project.consoleModules.length} modules
          </span>
          <Link
            href={consoleHref}
            className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary transition-transform hover:translate-x-0.5"
            aria-label={`Open ${project.name} console`}
          >
            Open console
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
