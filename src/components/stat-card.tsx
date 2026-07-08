import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * A period-over-period comparison. Only ever produced from real history —
 * today that means GA4-sourced widgets, since GA4 is the only data source
 * the console has more than a live snapshot of. Firestore-only stat cards
 * never receive one (no history exists to compare against).
 */
export interface StatDelta {
  pct: number;
  direction: "up" | "down" | "flat";
  /** Trailing phrase, e.g. "vs previous 7 days". */
  label: string;
}

function DeltaIndicator({ delta }: { delta: StatDelta }) {
  const Icon = delta.direction === "up" ? ArrowUp : delta.direction === "down" ? ArrowDown : Minus;
  const colorClass =
    delta.direction === "up"
      ? "text-[var(--console-live)]"
      : delta.direction === "down"
        ? "text-[var(--console-action)]"
        : "text-muted-foreground";

  return (
    <p
      className={cn("flex items-center gap-1 font-mono text-xs tabular-nums", colorClass)}
      aria-label={`${delta.direction} ${delta.pct}% ${delta.label}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      <span aria-hidden="true">
        {delta.pct}% {delta.label}
      </span>
    </p>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  format = "number",
  className,
}: {
  label: string;
  value: number | string | null;
  icon?: LucideIcon;
  hint?: string;
  delta?: StatDelta;
  format?: "number" | "raw";
  className?: string;
}) {
  const display =
    value == null
      ? "—"
      : typeof value === "number" && format === "number"
        ? formatNumber(value)
        : value;

  return (
    <Card
      className={cn(
        "console-stat-card overflow-hidden bg-card/90 shadow-sm transition-transform duration-150 hover:-translate-y-0.5",
        className,
      )}
    >
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {display}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {delta && <DeltaIndicator delta={delta} />}
        </div>
        {Icon && (
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
