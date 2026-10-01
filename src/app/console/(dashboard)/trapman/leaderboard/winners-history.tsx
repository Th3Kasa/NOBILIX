"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PRIZE_STATUSES,
  WINNER_PLACES,
  repeatWinners,
  type PrizeStatus,
  type WinnerRow,
} from "@/lib/trapman/winners";
import { setPrizeStatusAction } from "./actions";
import { EmailWinnerButton } from "./email-winner";

/**
 * Everyone who has placed in a past competition, newest first, with where
 * their prize is up to — so no winner is forgotten and nobody is paid twice.
 */

const STATUS_STYLE: Record<PrizeStatus, string> = {
  pending: "border-[var(--console-action-border)] text-[var(--console-action)]",
  contacted: "border-border text-foreground",
  sent: "border-emerald-500/40 text-emerald-500",
};

function placeStyle(place: number) {
  if (place === 1) return "bg-yellow-400/20 text-yellow-500";
  if (place === 2) return "bg-slate-400/20 text-slate-400";
  if (place === 3) return "bg-orange-400/20 text-orange-400";
  return "bg-muted text-muted-foreground";
}

export function WinnersHistory({
  rows,
  emails,
  canWrite,
}: {
  rows: WinnerRow[];
  /** Winner emails by uid; omit for read-only viewers. */
  emails?: Record<string, string>;
  canWrite: boolean;
}) {
  // Optimistic overrides, so a change shows instantly while it saves.
  const [statuses, setStatuses] = useState<Record<string, PrizeStatus>>({});
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const leaders = useMemo(() => repeatWinners(rows).slice(0, 5), [rows]);

  if (rows.length === 0) return null;

  const statusOf = (r: WinnerRow) => statuses[r.key] ?? r.status;
  const outstanding = rows.filter((r) => statusOf(r) !== "sent").length;

  function update(r: WinnerRow, status: PrizeStatus) {
    const previous = statusOf(r);
    if (previous === status) return;
    setError(null);
    setStatuses((s) => ({ ...s, [r.key]: status }));
    startTransition(async () => {
      const res = await setPrizeStatusAction(r.competitionId, r.uid, status, r.displayName);
      if (res.error) {
        setStatuses((s) => ({ ...s, [r.key]: previous }));
        setError(res.error);
      }
    });
  }

  return (
    <div className="console-glass rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <Medal className="size-4 text-primary" aria-hidden="true" />
        <h2 className="font-semibold">Winners history</h2>
        {outstanding > 0 && (
          <Badge variant="outline" className={STATUS_STYLE.pending}>
            {outstanding} prize{outstanding === 1 ? "" : "s"} not sent
          </Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          Top {WINNER_PLACES} of each competition
        </span>
      </div>

      {leaders.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/60 px-5 py-3 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wide">Most wins</span>
          {leaders.map((l) => (
            <span key={l.uid}>
              <span className="font-medium text-foreground">
                {l.displayName ?? `${l.uid.slice(0, 8)}…`}
              </span>{" "}
              {l.firsts > 0 && `${l.firsts}× 1st · `}
              {l.podiums} top-{WINNER_PLACES}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-5 py-3">Date</th>
              <th scope="col" className="px-3 py-3">Competition</th>
              <th scope="col" className="px-3 py-3">Place</th>
              <th scope="col" className="px-3 py-3">Player</th>
              <th scope="col" className="px-3 py-3 text-right">Score</th>
              <th scope="col" className="px-3 py-3">Prize</th>
              {emails && <th scope="col" className="w-14 px-3 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((r) => {
              const status = statusOf(r);
              return (
                <tr key={r.key} className="hover:bg-accent/30">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(r.resetAt).toLocaleDateString("en-AU")}
                  </td>
                  <td className="px-3 py-3">{r.competition}</td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                        placeStyle(r.place),
                      )}
                    >
                      {r.place}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">
                      {r.displayName ?? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.uid.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">
                    {r.score.toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    {canWrite ? (
                      <select
                        value={status}
                        onChange={(e) => update(r, e.target.value as PrizeStatus)}
                        aria-label={`Prize status for ${r.displayName ?? r.uid} in ${r.competition}`}
                        className={cn(
                          "min-h-11 rounded-md border bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          STATUS_STYLE[status],
                        )}
                      >
                        {PRIZE_STATUSES.map((s) => (
                          <option key={s.value} value={s.value} className="bg-background text-foreground">
                            {s.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="outline" className={STATUS_STYLE[status]}>
                        {PRIZE_STATUSES.find((s) => s.value === status)?.label}
                      </Badge>
                    )}
                  </td>
                  {emails && (
                    <td className="px-3 py-3 text-right">
                      <EmailWinnerButton
                        uid={r.uid}
                        email={emails[r.uid]}
                        displayName={r.displayName}
                        rank={r.place}
                        score={r.score}
                        competition={r.competition}
                        onSent={() => {
                          if (statusOf(r) === "pending") update(r, "contacted");
                        }}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
