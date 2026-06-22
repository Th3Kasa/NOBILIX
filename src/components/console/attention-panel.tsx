import { AlertTriangle } from "lucide-react";
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
        "rounded-xl border border-warning/30 bg-warning/5 p-5",
        className,
      )}
      role="region"
      aria-label="Items requiring attention"
    >
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle
          className="size-4 text-warning"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-warning">
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
                ? "text-warning/90"
                : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                item.severity === "warning"
                  ? "bg-warning"
                  : "bg-muted-foreground/40",
              )}
              aria-hidden="true"
            />
            <div>
              <span className="font-medium">{item.label}</span>
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
