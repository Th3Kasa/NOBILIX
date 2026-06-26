"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Send,
  BarChart3,
  ShoppingCart,
  FileDown,
  ScrollText,
  Settings,
  Gamepad2,
  MonitorPlay,
  Megaphone,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsoleModule } from "@/types/projects";

const MODULE_META: Record<
  ConsoleModule,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  users: { label: "Players", icon: Users },
  leaderboard: { label: "Leaderboard", icon: Trophy },
  messaging: { label: "Push notifications", icon: Send },
  analytics: { label: "Analytics", icon: BarChart3 },
  purchases: { label: "Purchases", icon: ShoppingCart },
  gameplay: { label: "Gameplay", icon: MonitorPlay },
  ads: { label: "Ads", icon: Megaphone },
  exports: { label: "Exports", icon: FileDown },
  audit: { label: "Audit log", icon: ScrollText },
  settings: { label: "Settings", icon: Settings },
};

export function ProjectSidebar({
  projectSlug,
  projectName,
  modules,
}: {
  projectSlug: string;
  projectName: string;
  modules: readonly ConsoleModule[];
}) {
  const pathname = usePathname();
  const consoleBase = `/console/${projectSlug}`;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
      {/* Project header with back link */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Gamepad2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground leading-tight">NOBILIX</p>
          <p className="truncate text-sm font-semibold leading-tight">
            {projectName}
          </p>
        </div>
      </div>

      {/* Module navigation */}
      <nav
        className="flex-1 space-y-1 p-3"
        aria-label={`${projectName} navigation`}
      >
        {modules.map((mod) => {
          const meta = MODULE_META[mod];
          if (!meta) return null;
          const href =
            mod === "overview" ? consoleBase : `${consoleBase}/${mod}`;
          const active =
            mod === "overview"
              ? pathname === consoleBase
              : pathname === href || pathname.startsWith(`${href}/`);

          const Icon = meta.icon;
          return (
            <Link
              key={mod}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-transform duration-150",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {meta.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: back to all projects */}
      <div className="border-t border-border p-3">
        <Link
          href="/console"
          className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition-transform hover:bg-accent hover:text-foreground"
          aria-label="Back to all projects"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          All projects
        </Link>
      </div>
    </aside>
  );
}
