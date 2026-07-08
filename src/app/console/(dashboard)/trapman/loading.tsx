import { SkeletonStatGrid, SkeletonTable } from "@/components/console/skeleton";

// Mirrors the overview page's shape: a row of stat cards followed by the
// "Latest scores" table block. The layout (.trapman/layout.tsx) already
// provides the <main> landmark, so this only needs the content skeleton.
export default function TrapManOverviewLoading() {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading TrapMan overview…</span>
      <SkeletonStatGrid count={4} />
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}
