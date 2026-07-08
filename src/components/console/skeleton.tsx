import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Loading-state primitives for the console. Every block is an
 * opacity-pulse-only `.console-skeleton` div (no layout-shifting
 * properties) that goes static under `prefers-reduced-motion` — see
 * globals.css. These mirror the real components' structure (StatCard,
 * table rows, chart cards) so nothing reflows once data arrives.
 */

function Block({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("console-skeleton", className)} />;
}

/** Mirrors the stat-card row used on the overview and analytics pages. */
export function SkeletonStatGrid({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="console-stat-card overflow-hidden bg-card/90 shadow-sm">
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="flex-1 space-y-2.5">
              <Block className="h-3 w-24" />
              <Block className="h-7 w-16" />
            </div>
            <Block className="size-9 shrink-0 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Mirrors the console-glass card wrapping a data table. */
export function SkeletonTable({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <Card className={cn("console-glass", className)}>
      <CardContent className="p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="flex gap-6">
            {Array.from({ length: columns }).map((_, i) => (
              <Block key={i} className="h-2.5 w-16" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-4">
              <Block className="h-4 flex-1" />
              <Block className="h-4 w-20" />
              <Block className="h-4 w-14" />
              {columns > 3 && <Block className="h-4 w-14" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** A generic glass card skeleton — heading line + one content block. */
export function SkeletonCard({
  className,
  bodyClassName = "h-56",
}: {
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn("console-glass", className)}>
      <CardHeader>
        <Block className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Block className={cn("w-full", bodyClassName)} />
      </CardContent>
    </Card>
  );
}
