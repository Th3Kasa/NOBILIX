import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricPanelProps {
  label: string;
  value: number | string | null;
  icon?: LucideIcon;
  hint?: string;
  /** Make this the primary (large) metric */
  primary?: boolean;
  className?: string;
}

function formatValue(value: number | string | null): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function MetricPanel({
  label,
  value,
  icon: Icon,
  hint,
  primary = false,
  className,
}: MetricPanelProps) {
  return (
    <div
      className={cn(
        "console-metric-panel console-glass flex flex-col gap-2 rounded-xl border border-border p-5 shadow-sm transition-transform duration-150 hover:-translate-y-0.5",
        primary && "col-span-2 row-span-2 sm:col-span-1",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-sm font-medium text-muted-foreground",
            primary && "text-base",
          )}
        >
          {label}
        </p>
        {Icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>
      <p
        className={cn(
          "font-mono font-semibold tabular-nums tracking-tight",
          primary ? "text-4xl" : "text-2xl",
          value == null && "text-muted-foreground/60",
        )}
        aria-label={`${label}: ${formatValue(value)}`}
      >
        {formatValue(value)}
      </p>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
