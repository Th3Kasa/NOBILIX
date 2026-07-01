"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Trophy,
  Trash2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  resetLeaderboardAction,
  removeEntryAction,
  type ResetState,
  type RemoveState,
} from "./actions";
import type { CompetitionRecord } from "@/types";

// ─── Reset competition button + modal ────────────────────────────────────────

function ResetSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending} className="w-full">
      {pending ? "Resetting…" : "Reset leaderboard"}
    </Button>
  );
}

export function ResetCompetitionModal() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const router = useRouter();

  const [state, formAction] = useActionState<ResetState, FormData>(
    async (prev, fd) => {
      const res = await resetLeaderboardAction(prev, fd);
      if (res.ok) {
        setOpen(false);
        setConfirm("");
        router.refresh();
      }
      return res;
    },
    {},
  );

  const PERIOD_OPTIONS = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "custom", label: "Custom" },
  ] as const;

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <RotateCcw className="size-4" />
        Reset competition
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Reset competition leaderboard">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-[var(--console-action-border)] bg-[var(--console-action-tint)] p-3 text-sm text-[var(--console-action)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">This action is irreversible.</p>
              <p className="mt-0.5 opacity-80">
                The top 10 winners will be archived, then every entry on the
                leaderboard is permanently deleted so the next competition
                period starts fresh.
              </p>
            </div>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Competition period</Label>
              <div className="grid grid-cols-4 gap-2">
                {PERIOD_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="relative flex cursor-pointer flex-col items-center rounded-md border border-border p-2 text-xs has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                  >
                    <input
                      type="radio"
                      name="periodType"
                      value={opt.value}
                      defaultChecked={opt.value === "weekly"}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="label">Competition name / label</Label>
              <Input
                id="label"
                name="label"
                placeholder="e.g. Weekly — June 10–17, 2026"
                maxLength={120}
                required
              />
              <p className="text-xs text-muted-foreground">
                This label appears in the archive so you can find this competition later.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">
                Type <span className="font-mono font-bold">RESET</span> to confirm
              </Label>
              <Input
                id="confirm"
                name="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="RESET"
                autoComplete="off"
                className="font-mono tracking-widest"
              />
            </div>

            {state.error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <div className="flex-1">
                <ResetSubmitButton />
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

// ─── Remove single leaderboard entry ─────────────────────────────────────────

export function RemoveEntryButton({
  uid,
  displayName,
}: {
  uid: string;
  displayName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [state, formAction] = useActionState<RemoveState, FormData>(
    async (prev, fd) => {
      const res = await removeEntryAction(prev, fd);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
      return res;
    },
    {},
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Remove from leaderboard"
        className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Remove leaderboard entry"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Remove{" "}
            <span className="font-medium text-foreground">
              {displayName ?? uid}
            </span>{" "}
            from the leaderboard? Their game account is not affected — only
            their competition entry is deleted.
          </p>

          <form action={formAction} className="space-y-3">
            <input type="hidden" name="uid" value={uid} />
            <input type="hidden" name="displayName" value={displayName ?? uid} />

            {state.error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" className="flex-1">
                Remove entry
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

// ─── Competition history accordion ───────────────────────────────────────────

function periodBadgeVariant(p: string) {
  if (p === "daily") return "secondary" as const;
  if (p === "weekly") return "default" as const;
  if (p === "monthly") return "success" as const;
  return "outline" as const;
}

export function CompetitionHistory({
  history,
}: {
  history: CompetitionRecord[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (history.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Trophy className="size-4 text-primary" />
        <h2 className="font-semibold">Past competitions</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {history.length} archived
        </span>
      </div>

      <ul className="divide-y divide-border/60">
        {history.map((comp) => {
          const isOpen = expanded === comp.id;
          return (
            <li key={comp.id}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : comp.id)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-accent/50 transition-colors"
              >
                <Badge
                  variant={periodBadgeVariant(comp.periodType)}
                  className="shrink-0 font-mono uppercase tracking-wide"
                >
                  {comp.periodType}
                </Badge>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {comp.label}
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {comp.totalEntries} players
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {new Date(comp.resetAt).toLocaleDateString()}
                </span>
                {isOpen ? (
                  <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-border/40 bg-muted/20 px-5 py-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Reset by {comp.resetBy} · {new Date(comp.resetAt).toLocaleString()}
                  </p>
                  <ol className="space-y-1.5">
                    {comp.winners.map((w, i) => (
                      <li
                        key={w.uid}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            i === 0
                              ? "bg-yellow-400/20 text-yellow-500"
                              : i === 1
                                ? "bg-slate-400/20 text-slate-400"
                                : i === 2
                                  ? "bg-orange-400/20 text-orange-400"
                                  : "bg-muted text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="flex-1 font-medium">
                          {w.displayName ?? w.uid.slice(0, 8) + "…"}
                        </span>
                        {w.country && (
                          <span className="text-xs text-muted-foreground">
                            {w.country}
                          </span>
                        )}
                        <span className="font-mono text-xs font-semibold tabular-nums">
                          {w.score.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
