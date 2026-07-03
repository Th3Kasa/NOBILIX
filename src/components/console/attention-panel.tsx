import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttentionItem {
  id: string;
  label: string;
  description?: string;
  severity?: "warning" | "info";
}

interface AttentionPanelProps {
  items: AttentionItem[];
  className?: string;
}

export function AttentionPanel({ items, className }: AttentionPanelProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "console-attention-panel console-empty-state rounded-xl border border-[var(--console-action-border)] bg-[var(--console-action-tint)] p-5",
        className,
      )}
      role="region"
      aria-label="Items requiring attention"
    >
      <div className="relative mb-3 flex items-center gap-2">
        <AlertTriangle
          className="size-4 text-[var(--console-action)] drop-shadow-[0_0_4px_var(--console-action)]"
          aria-hidden="true"
        />
        <h2 className="console-pixel-label text-[var(--console-action)]">
          Needs attention ({items.length})
        </h2>
      </div>
      <ul className="space-y-2" role="list">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-2 text-sm",
              item.severity === "warning"
                ? "text-[var(--console-action)]"
                : "text-[var(--console-violet)]",
            )}
          >
            {item.severity === "info" ? (
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--console-action)]"
                aria-hidden="true"
              />
            )}
            <div>
              <span className="font-medium text-foreground">{item.label}</span>
              {item.description && (
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
