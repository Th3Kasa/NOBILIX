import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveStatus({
  connected,
  className,
}: {
  connected: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "console-live-status flex min-h-11 items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wide",
        connected
          ? "border-[var(--console-live-border)] bg-[var(--console-live-tint)] text-[var(--console-live)]"
          : "border-[var(--console-action-border)] bg-[var(--console-action-tint)] text-[var(--console-action)]",
        className,
      )}
      role="status"
      aria-label={connected ? "Firebase connected" : "Firebase not connected"}
    >
      {connected ? (
        <>
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--console-live)] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[var(--console-live)]" />
          </span>
          <Wifi className="size-3.5" aria-hidden="true" />
          Live
        </>
      ) : (
        <>
          <WifiOff className="size-3.5" aria-hidden="true" />
          Not connected
        </>
      )}
    </div>
  );
}
