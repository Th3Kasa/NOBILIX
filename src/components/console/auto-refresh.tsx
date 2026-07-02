"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 30_000;

/**
 * Live-data heartbeat for the console.
 *
 * Every console page under this component's layout re-fetches straight from
 * Firestore on render (`dynamic = "force-dynamic"`), so a `router.refresh()`
 * is all it takes to pull the latest game events into the CRM. This component
 * triggers that automatically every 30 seconds — paused while the tab is
 * hidden — and offers a manual refresh button.
 */
export function AutoRefresh({ className }: { className?: string }) {
  const router = useRouter();
  const [lastRefreshed, setLastRefreshed] = useState<number>(() => Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  const refresh = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    router.refresh();
    // router.refresh() has no completion callback; show the spin briefly.
    setTimeout(() => {
      refreshingRef.current = false;
      setRefreshing(false);
      setLastRefreshed(Date.now());
    }, 900);
  }, [router]);

  // Auto-refresh on an interval, but never while the tab is hidden.
  useEffect(() => {
    const tick = () => {
      if (!document.hidden) refresh();
    };
    const interval = setInterval(tick, REFRESH_INTERVAL_MS);
    const onVisible = () => {
      // Coming back to the tab pulls fresh data immediately.
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // "Updated Ns ago" ticker.
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.round((Date.now() - lastRefreshed) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      <span className="relative flex size-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--console-live)] opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-[var(--console-live)]" />
      </span>
      <span>
        Live · updated {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
      </span>
      <button
        type="button"
        onClick={refresh}
        className="flex min-h-11 items-center gap-1 rounded-md px-2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Refresh data now"
      >
        <RefreshCw
          className={cn("size-3.5", refreshing && "animate-spin")}
          aria-hidden="true"
        />
        Refresh
      </button>
    </div>
  );
}
