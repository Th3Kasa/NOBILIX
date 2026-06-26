import Link from "next/link";
import { ArrowRight, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectDefinition } from "@/types/projects";

const STATUS_LABELS: Record<ProjectDefinition["status"], string> = {
  live: "Live",
  development: "In development",
  planned: "Planned",
};

const STATUS_VARIANT: Record<
  ProjectDefinition["status"],
  "default" | "secondary" | "outline"
> = {
  live: "default",
  development: "secondary",
  planned: "outline",
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
          <Badge variant={STATUS_VARIANT[project.status]}>
            <Circle
              className={`mr-1 size-1.5 fill-current ${project.status === "live" ? "text-green-500" : ""}`}
            />
            {STATUS_LABELS[project.status]}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        {/* Module count + CTA */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
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
