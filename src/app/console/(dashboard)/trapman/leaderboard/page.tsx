import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatNumber, countryFlag, cn } from "@/lib/utils";
import { listLeaderboard, getCompetitionHistory } from "@/lib/leaderboard";
import {
  ResetCompetitionModal,
  RemoveEntryButton,
  CompetitionHistory,
} from "./leaderboard-controls";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [session, { entries, totalCount, connected, error }, history] =
    await Promise.all([
      auth(),
      listLeaderboard(100, 0),
      getCompetitionHistory(20),
    ]);

  const canWrite = session?.user?.role !== "viewer";

  return (
    <>
      <PageHeader
        title="Competition leaderboard"
        description={
          connected
            ? `${formatNumber(totalCount)} player${totalCount !== 1 ? "s" : ""} on the current board`
            : "Leaderboard · Firebase unreachable"
        }
        action={
          canWrite && connected && entries.length > 0 ? (
            <ResetCompetitionModal />
          ) : undefined
        }
      />

      {!connected && (
        <div className="console-empty-state mb-4 rounded-lg border border-[var(--console-action-border)] bg-[var(--console-action-tint)] px-4 py-3 text-sm text-[var(--console-action)]">
          <span className="relative">
            Couldn&apos;t connect to the game&apos;s database:{" "}
            {error ?? "unknown error"}. Add the connection details to the
            app&apos;s environment settings.
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* Current leaderboard */}
        <div className="console-glass rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <h2 className="font-semibold">Current standings</h2>
            {connected && (
              <Badge variant="success" className="ml-auto font-mono uppercase tracking-wide">
                <span className="mr-1 size-1.5 rounded-full bg-current drop-shadow-[0_0_3px_currentColor]" />
                Live
              </Badge>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="console-empty-state">
              <p className="relative px-5 py-12 text-center text-sm text-muted-foreground">
                {connected
                  ? "No entries yet — the competition hasn't started or the leaderboard is empty."
                  : "Connect Firebase to view leaderboard data."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 w-14">#</th>
                    <th className="px-3 py-3">Player</th>
                    <th className="px-3 py-3 hidden sm:table-cell">Country</th>
                    <th className="px-3 py-3 hidden md:table-cell">Character</th>
                    <th className="px-3 py-3 text-right">Score</th>
                    {canWrite && <th className="px-3 py-3 w-10" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {entries.map((entry) => (
                    <tr
                      key={entry.uid}
                      className="group transition-colors hover:bg-accent/30"
                    >
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "font-mono tabular-nums",
                            entry.rank === 1
                              ? "text-yellow-500 font-bold drop-shadow-[0_0_5px_var(--neon-yellow)]"
                              : entry.rank === 2
                                ? "text-slate-400 font-bold"
                                : entry.rank === 3
                                  ? "text-orange-400 font-bold"
                                  : "text-muted-foreground",
                          )}
                        >
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium">
                          {entry.displayName ?? (
                            <span className="text-muted-foreground font-mono text-xs">
                              {entry.uid.slice(0, 8)}…
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {entry.uid.slice(0, 12)}…
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell text-muted-foreground">
                        {entry.country ? (
                          <span>
                            {countryFlag(entry.country)}{" "}
                            <span className="text-xs">{entry.country}</span>
                          </span>
                        ) : (
                          <span className="text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {entry.character ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                        {entry.score.toLocaleString()}
                      </td>
                      {canWrite && (
                        <td className="px-3 py-3 text-right">
                          <RemoveEntryButton
                            uid={entry.uid}
                            displayName={entry.displayName}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Past competition archive */}
        <CompetitionHistory history={history} />
      </div>
    </>
  );
}
