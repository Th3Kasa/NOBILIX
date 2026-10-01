"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertCircle, AlertTriangle, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { countryFlag, cn } from "@/lib/utils";
import { removeEntriesAction, type RemoveState } from "./actions";
import { EditScoreButton, RemoveEntryButton } from "./leaderboard-controls";
import type { LeaderboardEntry } from "@/types";

/**
 * The standings table, with selection so several entries can be removed in one
 * action.
 *
 * Bulk removal exists because the realistic cleanup job is not "delete this
 * one cheater" — it is "delete the 109 seeded placeholder rows that are
 * outranking real players". Doing that one confirmation at a time is not a
 * workflow anybody completes, so the board stays wrong.
 *
 * Selection is keyed by uid and survives filtering, so an operator can search
 * `seed_`, select all matches, clear the filter, search something else, and
 * still delete everything they picked in one go.
 */

function DeleteSelectedButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending} className="w-full">
      {pending
        ? "Removing…"
        : `Remove ${count} entr${count === 1 ? "y" : "ies"}`}
    </Button>
  );
}

export function LeaderboardTable({
  entries,
  canWrite,
}: {
  entries: LeaderboardEntry[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.uid.toLowerCase().includes(q) ||
        (e.displayName ?? "").toLowerCase().includes(q) ||
        (e.country ?? "").toLowerCase().includes(q),
    );
  }, [entries, query]);

  const visibleSelectedCount = visible.filter((e) => selected.has(e.uid)).length;
  const allVisibleSelected =
    visible.length > 0 && visibleSelectedCount === visible.length;

  const [state, formAction] = useActionState<RemoveState, FormData>(
    async (prev, fd) => {
      const res = await removeEntriesAction(prev, fd);
      if (res.ok) {
        setSelected(new Set());
        setConfirmOpen(false);
        router.refresh();
      }
      return res;
    },
    {},
  );

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((e) => next.delete(e.uid));
      else visible.forEach((e) => next.add(e.uid));
      return next;
    });
  }

  const selectedEntries = entries.filter((e) => selected.has(e.uid));

  return (
    <>
      {canWrite && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, player ID or country…"
              aria-label="Filter leaderboard entries"
              className="pl-8"
            />
          </div>

          {query && (
            <span className="text-sm text-muted-foreground">
              {visible.length} of {entries.length} shown
            </span>
          )}

          {selected.size > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-medium">
                {selected.size} selected
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
                className="gap-1.5"
              >
                <X className="size-3.5" aria-hidden="true" />
                Clear
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                className="gap-1.5"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove selected
              </Button>
            </div>
          )}
        </div>
      )}

      {state.error && (
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {canWrite && (
                <th scope="col" className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    disabled={visible.length === 0}
                    aria-label={
                      allVisibleSelected
                        ? "Deselect all shown entries"
                        : "Select all shown entries"
                    }
                    className="size-4 cursor-pointer accent-[var(--console-violet)]"
                  />
                </th>
              )}
              <th scope="col" className="w-14 px-3 py-3">#</th>
              <th scope="col" className="px-3 py-3">Player</th>
              <th scope="col" className="hidden px-3 py-3 sm:table-cell">Country</th>
              <th scope="col" className="hidden px-3 py-3 md:table-cell">Character</th>
              <th scope="col" className="px-3 py-3 text-right">Score</th>
              {canWrite && <th scope="col" className="w-24 px-3 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={canWrite ? 7 : 5}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  No entries match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            ) : (
              visible.map((entry) => {
                const isSelected = selected.has(entry.uid);
                return (
                  <tr
                    key={entry.uid}
                    className={cn(
                      "group transition-colors hover:bg-accent/30",
                      isSelected && "bg-[var(--console-violet-tint)]",
                    )}
                  >
                    {canWrite && (
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(entry.uid)}
                          aria-label={`Select ${entry.displayName ?? entry.uid}`}
                          className="size-4 cursor-pointer accent-[var(--console-violet)]"
                        />
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "font-mono tabular-nums",
                          entry.rank === 1
                            ? "font-bold text-yellow-500 drop-shadow-[0_0_5px_var(--neon-yellow)]"
                            : entry.rank === 2
                              ? "font-bold text-slate-400"
                              : entry.rank === 3
                                ? "font-bold text-orange-400"
                                : "text-muted-foreground",
                        )}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">
                        {entry.displayName ?? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {entry.uid.slice(0, 8)}…
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {entry.uid.slice(0, 12)}…
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
                      {entry.country ? (
                        <span>
                          {countryFlag(entry.country)}{" "}
                          <span className="text-xs">{entry.country}</span>
                        </span>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-muted-foreground md:table-cell">
                      {entry.character ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                      {entry.score.toLocaleString()}
                    </td>
                    {canWrite && (
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <EditScoreButton
                            uid={entry.uid}
                            displayName={entry.displayName}
                            score={entry.score}
                          />
                          <RemoveEntryButton
                            uid={entry.uid}
                            displayName={entry.displayName}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Remove ${selected.size} leaderboard entr${selected.size === 1 ? "y" : "ies"}`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-[var(--console-action-border)] bg-[var(--console-action-tint)] p-3 text-sm text-[var(--console-action)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">This cannot be undone.</p>
              <p className="mt-0.5 opacity-80">
                These competition entries are deleted permanently. The
                players&apos; game accounts and progress are not affected.
              </p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-md border border-border">
            <ul className="divide-y divide-border/60 text-sm">
              {selectedEntries.slice(0, 100).map((e) => (
                <li
                  key={e.uid}
                  className="flex items-center justify-between gap-3 px-3 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {e.displayName ?? e.uid}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {e.score.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            {selectedEntries.length > 100 && (
              <p className="border-t border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
                …and {selectedEntries.length - 100} more.
              </p>
            )}
          </div>

          <form action={formAction} className="space-y-3">
            {selectedEntries.map((e) => (
              <input key={e.uid} type="hidden" name="uids" value={e.uid} />
            ))}

            {state.error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <div className="flex-1">
                <DeleteSelectedButton count={selected.size} />
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
