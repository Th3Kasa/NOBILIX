"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FlaskConical, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/console/local-time";
import {
  markTestAccountAction,
  unmarkTestAccountAction,
  type TestAccountState,
} from "./actions";

export interface BuyerSummary {
  uid: string;
  name: string | null;
  /** Purchases that counted as real sales in the window. */
  purchaseCount: number;
  /** Purchases in the window that were left out (tests, refunds, editor…). */
  excludedCount: number;
  /** What their counted purchases came to, already formatted in AUD. */
  spent: string;
  platforms: string[];
  lastPurchaseAt: number;
  isTestAccount: boolean;
  /** True when every one of this buyer's purchases came from a Unity Editor. */
  editorOnly: boolean;
}

function SubmitButton({
  children,
  pendingLabel,
  variant = "outline",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "outline" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending} className="min-h-9">
      {pending ? pendingLabel : children}
    </Button>
  );
}

function TesterToggle({ buyer }: { buyer: BuyerSummary }) {
  const action = buyer.isTestAccount ? unmarkTestAccountAction : markTestAccountAction;
  const [state, dispatch] = useActionState<TestAccountState, FormData>(action, {});
  return (
    <form action={dispatch} className="flex flex-col items-end gap-1">
      <input type="hidden" name="uid" value={buyer.uid} />
      {!buyer.isTestAccount && <input type="hidden" name="label" value={buyer.name ?? ""} />}
      {buyer.isTestAccount ? (
        <SubmitButton pendingLabel="Restoring…" variant="ghost">
          <Undo2 className="mr-1.5 size-3.5" aria-hidden="true" />
          Count as revenue
        </SubmitButton>
      ) : (
        <SubmitButton pendingLabel="Excluding…">
          <FlaskConical className="mr-1.5 size-3.5" aria-hidden="true" />
          Mark as test
        </SubmitButton>
      )}
      {state.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}

/**
 * Who bought the most, ranked by what they spent. Also where an operator
 * excludes an internal tester from revenue — reversible and audit-logged —
 * so testers stay listed here (marked, at the bottom) rather than vanishing.
 */
export function TopBuyers({ buyers, canWrite }: { buyers: BuyerSummary[]; canWrite: boolean }) {
  if (buyers.length === 0) {
    return <p className="text-sm text-muted-foreground">No purchases in this period.</p>;
  }
  // Buyers arrive ranked, counted ones first, so a row's rank is its position.
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">#</th>
            <th scope="col" className="py-2 pr-4 font-medium">Player</th>
            <th scope="col" className="py-2 pr-4 font-medium">Bought</th>
            <th scope="col" className="py-2 pr-4 font-medium">Spent (AUD)</th>
            <th scope="col" className="py-2 pr-4 font-medium">Platform</th>
            <th scope="col" className="py-2 pr-4 font-medium">Last purchase</th>
            {canWrite && <th scope="col" className="py-2 font-medium"><span className="sr-only">Tester</span></th>}
          </tr>
        </thead>
        <tbody>
          {buyers.map((b, i) => {
            const counted = b.purchaseCount > 0;
            return (
              <tr key={b.uid} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                <td className="py-2.5 pr-3 font-mono tabular-nums text-muted-foreground">
                  {counted ? i + 1 : "—"}
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/console/trapman/users/${encodeURIComponent(b.uid)}`}
                    className="font-medium hover:underline"
                  >
                    {b.name ?? "(no name)"}
                  </Link>
                  {b.isTestAccount && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--console-violet-tint)] px-2 py-0.5 text-xs text-[var(--console-violet)]">
                      <FlaskConical className="size-3" aria-hidden="true" />
                      Tester
                    </span>
                  )}
                  {b.editorOnly && !b.isTestAccount && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Editor only
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4 font-mono tabular-nums">
                  {b.purchaseCount}
                  {b.excludedCount > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      +{b.excludedCount} not counted
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4 font-mono tabular-nums">{b.spent}</td>
                <td className="py-2.5 pr-4 text-xs">{b.platforms.join(", ")}</td>
                <td className="py-2.5 pr-4 font-mono text-xs tabular-nums text-muted-foreground">
                  <LocalTime ms={b.lastPurchaseAt} variant="datetime" />
                </td>
                {canWrite && (
                  <td className="py-2.5 text-right">
                    <TesterToggle buyer={b} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
