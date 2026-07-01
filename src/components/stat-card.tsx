import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  format = "number",
  className,
}: {
  label: string;
  value: number | string | null;
  icon?: LucideIcon;
  hint?: string;
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
