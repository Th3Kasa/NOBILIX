"use client";

/**
 * Shared recharts <Tooltip content={...}> renderer for every console chart
 * (analytics' country/level charts, the overview's activity chart). Keeps
 * tooltip styling — and any future changes to it — in one place.
 */
export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: { value?: number; name?: string }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="console-glass rounded-md border border-border px-3 py-2 font-mono text-xs shadow-lg">
      {label && <p className="mb-1 text-muted-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="font-semibold tabular-nums text-foreground">
          {entry.name ? `${entry.name}: ` : ""}
          {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}
