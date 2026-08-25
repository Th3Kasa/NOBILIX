"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FlaskConical, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  markTestAccountAction,
  unmarkTestAccountAction,
  type TestAccountState,
} from "./actions";

export interface BuyerSummary {
  uid: string;
  name: string | null;
  purchaseCount: number;
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
    <Button
      type="submit"
      size="sm"
      variant={variant}
      disabled={pending}
      className="min-h-9"
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

function BuyerRow({ buyer }: { buyer: BuyerSummary }) {
  const action = buyer.isTestAccount
    ? unmarkTestAccountAction
    : markTestAccountAction;
  const [state, dispatch] = useActionState<TestAccountState, FormData>(action, {});

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium">
          {buyer.name ?? "(no name)"}
          {buyer.isTestAccount && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--console-violet-tint)] px-2 py-0.5 text-xs font-normal text-[var(--console-violet)]">
              <FlaskConical className="size-3" aria-hidden="true" />
              Test account
            </span>
          )}
          {buyer.editorOnly && !buyer.isTestAccount && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              Editor only — already excluded
            </span>
          )}
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {buyer.uid} · {buyer.purchaseCount} purchase
          {buyer.purchaseCount === 1 ? "" : "s"}
        </p>
        {state.error && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {state.error}
          </p>
        )}
      </div>

      <form action={dispatch}>
        <input type="hidden" name="uid" value={buyer.uid} />
        {!buyer.isTestAccount && (
          <input type="hidden" name="label" value={buyer.name ?? ""} />
        )}
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
      </form>
    </li>
  );
}

/**
 * Lets an operator exclude internal testers from revenue without touching the
 * game's data. Every change is reversible and audit-logged.
 */
export function TestAccountControls({ buyers }: { buyers: BuyerSummary[] }) {
  if (buyers.length === 0) return null;
  return (
    <ul className="flex flex-col">
      {buyers.map((b) => (
        <BuyerRow key={b.uid} buyer={b} />
      ))}
    </ul>
  );
}
