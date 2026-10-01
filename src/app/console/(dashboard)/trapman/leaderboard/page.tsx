import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import {
  listLeaderboard,
  listEventBoards,
  getCompetitionHistory,
} from "@/lib/leaderboard";
import { getPlayerEmails } from "@/lib/users";
import {
  ResetCompetitionModal,
  CompetitionHistory,
} from "./leaderboard-controls";
import { LeaderboardTable } from "./leaderboard-table";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [session, { entries, totalCount, connected, error }, history, eventBoards] =
    await Promise.all([
      auth(),
      listLeaderboard(100, 0),
      getCompetitionHistory(20),
      listEventBoards(),
    ]);

  const canWrite = session?.user?.role !== "viewer";

  // Emails are only fetched for people who can act on them.
  const emails = canWrite
    ? await getPlayerEmails([
        ...entries.map((e) => e.uid),
        ...history.flatMap((c) => c.winners.map((w) => w.uid)),
      ])
    : undefined;

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
          canWrite && connected ? (
            <ResetCompetitionModal
              mainBoardCount={totalCount}
              eventBoards={eventBoards}
            />
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
        {/* Per-event boards. The game scores timed events on their own boards,
            and until now the console could not see them at all. */}
        {connected && eventBoards.length > 0 && (
          <div className="console-glass rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <h2 className="font-semibold">Event boards</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                Scored separately from the overall board
              </span>
            </div>
            <ul className="divide-y divide-border/60">
              {eventBoards.map((board) => (
                <li
                  key={board.eventId}
                  className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                >
                  <span className="font-medium">
                    {board.eventName ?? board.eventId}
                  </span>
                  {board.isCurrent && (
                    <Badge
                      variant="success"
                      className="font-mono uppercase tracking-wide"
                    >
                      Current event
                    </Badge>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    {board.eventId}
                  </span>
                  <span className="ml-auto font-mono text-sm tabular-nums">
                    {formatNumber(board.entryCount)} entr
                    {board.entryCount === 1 ? "y" : "ies"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
              &ldquo;Reset competition&rdquo; can clear these too — pick which
              boards to wipe in the reset dialog.
            </p>
          </div>
        )}

        {/* Current standings */}
        <div className="console-glass rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <h2 className="font-semibold">Current standings</h2>
            {connected && (
              <Badge
                variant="success"
                className="ml-auto font-mono uppercase tracking-wide"
              >
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
            <LeaderboardTable entries={entries} canWrite={canWrite} emails={emails} />
          )}

          {connected && totalCount > entries.length && (
            <p className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
              Showing the top {entries.length} of {formatNumber(totalCount)}{" "}
              entries.
            </p>
          )}
        </div>

        {/* Past competition archive */}
        <CompetitionHistory history={history} emails={emails} />
      </div>
    </>
  );
}
