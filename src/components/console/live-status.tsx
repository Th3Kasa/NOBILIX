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
        "console-live-status flex min-h-11 items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium",
        connected
          ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
          : "border-border bg-muted/50 text-muted-foreground",
        className,
      )}
      role="status"
      aria-label={connected ? "Firebase connected" : "Firebase not connected"}
    >
      {connected ? (
        <>
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
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
