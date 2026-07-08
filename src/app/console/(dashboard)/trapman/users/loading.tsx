import { SkeletonTable } from "@/components/console/skeleton";

export default function UsersLoading() {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading players…</span>
      <SkeletonTable rows={8} columns={6} />
    </div>
  );
}
