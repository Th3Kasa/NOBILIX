import { SkeletonCard } from "@/components/console/skeleton";

export default function AnalyticsLoading() {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading analytics…</span>
      <div className="console-page-grid">
        <SkeletonCard className="console-grid-span-6" bodyClassName="h-64" />
        <SkeletonCard className="console-grid-span-6" bodyClassName="h-64" />
      </div>
    </div>
  );
}
