import { SkeletonTable } from "@/components/console/skeleton";

export default function AuditLoading() {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading audit log…</span>
      <SkeletonTable rows={10} columns={4} />
    </div>
  );
}
