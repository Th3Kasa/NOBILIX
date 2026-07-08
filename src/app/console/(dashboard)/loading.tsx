import { Card, CardContent } from "@/components/ui/card";

// Mirrors ProjectTile's structure (icon + name/kind, status pill,
// description line, footer module-count + link) so nothing reflows once
// the real project list renders.
function TileSkeleton() {
  return (
    <Card className="console-project-tile console-glass h-full">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="console-skeleton size-10 rounded-lg" />
            <div className="space-y-1.5">
              <div aria-hidden="true" className="console-skeleton h-3.5 w-24 rounded" />
              <div aria-hidden="true" className="console-skeleton h-2.5 w-14 rounded" />
            </div>
          </div>
          <div aria-hidden="true" className="console-skeleton h-5 w-16 rounded-full" />
        </div>
        <div aria-hidden="true" className="console-skeleton h-3.5 w-full rounded" />
        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
          <div aria-hidden="true" className="console-skeleton h-3 w-16 rounded" />
          <div aria-hidden="true" className="console-skeleton h-3.5 w-20 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConsoleLoading() {
  return (
    <main id="main-content" tabIndex={-1} aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading projects…</span>
      <div className="console-page-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="console-grid-span-4">
            <TileSkeleton />
          </div>
        ))}
      </div>
    </main>
  );
}
