"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FlaskConical, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  markAllPurchasesAsTestAction,
  unmarkAllTestPurchasesAction,
} from "./actions";

/**
 * Clear every purchase recorded so far out of the sales figures in one go —
 * for launch day, when everything in the database is QA and sandbox activity.
 * Console-side and reversible; purchases made afterwards count normally.
 */
export function TestPurchasesControl({
  realSales,
  marked,
  canWrite,
}: {
  /** Purchases currently counted as real sales, all time. */
  realSales: number;
  /** Purchases already marked as tests. */
  marked: number;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok?: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.error) setError(res.error);
      else {
        setConfirmOpen(false);
        router.refresh();
      }
    });
  }

  if (!canWrite || (realSales === 0 && marked === 0)) return null;

  return (
    <div className="console-glass mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm">
      <FlaskConical className="size-4 shrink-0 text-[var(--console-violet)]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Test purchases</p>
        <p className="text-muted-foreground">
          {marked > 0
            ? `${marked} purchase${marked === 1 ? " is" : "s are"} marked as tests and left out of every figure.`
            : "Purchases made while testing still count as sales."}{" "}
          {realSales > 0 &&
            `${realSales} purchase${realSales === 1 ? "" : "s"} currently count${realSales === 1 ? "s" : ""} as real.`}
        </p>
        {error && (
          <p className="mt-1 flex items-center gap-1.5 text-destructive">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {marked > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => run(unmarkAllTestPurchasesAction)}
            className="gap-1.5"
          >
            <Undo2 className="size-3.5" aria-hidden="true" />
            Undo — count them again
          </Button>
        )}
        {realSales > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
          >
            Mark all as tests
          </Button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Mark every purchase so far as a test?"
      >
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            All{" "}
            <span className="font-medium text-foreground">
              {realSales} purchase{realSales === 1 ? "" : "s"}
            </span>{" "}
            that currently count as sales will be left out of revenue, sales
            and buyer figures on every tab.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Purchases made after this still count as normal.</li>
            <li>Nothing in the game is changed or deleted — players keep their items.</li>
            <li>You can undo it at any time from this page.</li>
          </ul>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => run(markAllPurchasesAsTestAction)}
              className="flex-1"
            >
              {pending ? "Marking…" : `Mark ${realSales} as tests`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
