import Link from "next/link";
import { ArrowRight, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

export function ProjectTile({ project }: { project: ProjectDefinition }) {
  const consoleHref = `/console/${project.slug}`;

  return (
    <Card className="console-project-tile group overflow-hidden bg-card/80 transition-transform hover:-translate-y-0.5">
      <CardContent className="flex flex-col gap-4 p-6">
        {/* Header: logo + name + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.logoPath}
                alt={`${project.name} logo`}
                width={28}
                height={28}
                className="size-7 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <p className="font-semibold leading-tight">{project.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
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
            <Circle className="size-1.5 fill-current" aria-hidden="true" />
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        {/* Module count + CTA */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">
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
