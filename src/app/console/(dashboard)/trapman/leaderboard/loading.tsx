import { SkeletonTable } from "@/components/console/skeleton";

export default function LeaderboardLoading() {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading leaderboard…</span>
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}
