"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 60_000;
/** Stop refreshing after this long with no mouse, keyboard or touch input. */
const IDLE_AFTER_MS = 5 * 60_000;
const ACTIVITY_EVENTS = [
  "pointermove",
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
] as const;

/**
 * Live-data heartbeat for the console.
 *
 * Every console page under this component's layout re-fetches straight from
 * Firestore on render (`dynamic = "force-dynamic"`), so a `router.refresh()`
 * is all it takes to pull the latest game events into the CRM. This component
 * triggers that automatically every minute and offers a manual refresh button.
 *
 * It refreshes only while someone is actually looking: never while the tab is
 * hidden, and not after five minutes without input. Every refresh costs
 * Firestore reads against the same daily quota the GAME uses, and a visible
 * tab left open overnight once exhausted that quota and took sign-in (and the
 * game's own reads) down with it. Any input resumes immediately.
 */
export function AutoRefresh({ className }: { className?: string }) {
  const router = useRouter();
  const [lastRefreshed, setLastRefreshed] = useState<number>(() => Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [idle, setIdle] = useState(false);
  const refreshingRef = useRef(false);
  const idleRef = useRef(false);
  /** Set when the effect below mounts; reading the clock during render is impure. */
  const lastActivityRef = useRef(0);

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

  // Auto-refresh on an interval — never while the tab is hidden or idle.
  useEffect(() => {
    lastActivityRef.current = Date.now();
    const wake = () => {
      lastActivityRef.current = Date.now();
      if (idleRef.current) {
        idleRef.current = false;
        setIdle(false);
        // Back from idle: the data is stale, so pull it now.
        refresh();
      }
    };
    const tick = () => {
      if (document.hidden) return;
      if (Date.now() - lastActivityRef.current > IDLE_AFTER_MS) {
        if (!idleRef.current) {
          idleRef.current = true;
          setIdle(true);
        }
        return;
      }
      refresh();
    };
    const interval = setInterval(tick, REFRESH_INTERVAL_MS);
    const onVisible = () => {
      // Coming back to the tab counts as activity and pulls fresh data.
      if (document.hidden) return;
      if (idleRef.current) wake();
      else {
        lastActivityRef.current = Date.now();
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    for (const e of ACTIVITY_EVENTS) {
      window.addEventListener(e, wake, { passive: true });
    }
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, wake);
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
        {!idle && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--console-live)] opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            idle ? "bg-muted-foreground/50" : "bg-[var(--console-live)]",
          )}
        />
      </span>
      <span>
        {idle
          ? "Paused while idle"
          : `Live · updated ${secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}`}
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
