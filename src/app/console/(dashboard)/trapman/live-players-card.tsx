"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalTime } from "@/components/console/local-time";
import { countryFlag, formatNumber } from "@/lib/utils";
import type { LivePlayers } from "./live-players";

/** The server caches Google for 30 s, so polling faster than this shows nothing new. */
const POLL_MS = 60_000;
const MAX_COUNTRIES = 6;

function plural(n: number, one: string, many: string) {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}

/** Minute-by-minute activity over the last 30 minutes, newest on the right. */
function MinuteBars({ series }: { series: number[] }) {
  const peak = Math.max(1, ...series);
  return (
    <div className="flex h-12 items-end gap-[3px]" aria-hidden="true">
      {series.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm bg-[var(--console-live)]"
          style={{ height: `${Math.max(4, (v / peak) * 100)}%`, opacity: v === 0 ? 0.18 : 0.85 }}
          title={`${series.length - 1 - i === 0 ? "This minute" : `${series.length - 1 - i} min ago`}: ${v}`}
        />
      ))}
    </div>
  );
}

/**
 * "Playing right now" — Google Analytics Realtime, refreshed every minute
 * while the tab is visible. Starts from the server-rendered snapshot so the
 * number is there on first paint.
 */
export function LivePlayersCard({ initial }: { initial: LivePlayers }) {
  const [live, setLive] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/trapman/live-players", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as LivePlayers;
        if (!cancelled) setLive(next);
      } catch {
        // Offline or a blip — keep showing the last good reading.
      }
    };
    const id = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const shownCountries = live.countries.slice(0, MAX_COUNTRIES);
  const moreCountries = live.countries.length - shownCountries.length;

  return (
    <Card className="console-glass mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="relative flex size-2.5" aria-hidden="true">
            {live.connected && live.now > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--console-live)] opacity-75 motion-reduce:animate-none" />
            )}
            <span
              className={`relative inline-flex size-2.5 rounded-full ${
                live.connected && live.now > 0 ? "bg-[var(--console-live)]" : "bg-muted-foreground/50"
              }`}
            />
          </span>
          Playing right now
          <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <Radio className="size-3.5" aria-hidden="true" />
            Google Analytics · live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!live.connected ? (
          <p className="text-sm text-muted-foreground">
            Live players couldn&apos;t be loaded — {live.error ?? "Google Analytics isn't connected."}{" "}
            Trying again every minute.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-[auto_1fr]">
            <div aria-live="polite">
              <p className="font-mono text-5xl font-semibold tabular-nums leading-none text-[var(--console-live)]">
                {formatNumber(live.now)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {live.now === 1 ? "player" : "players"} in the last 5 minutes
              </p>
              <p className="mt-1 text-sm">
                <span className="font-mono tabular-nums">{formatNumber(live.last30)}</span>{" "}
                <span className="text-muted-foreground">in the last 30 minutes</span>
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              {live.perMinute.length > 0 && (
                <div>
                  <MinuteBars series={live.perMinute} />
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>30 min ago</span>
                    <span>now</span>
                  </div>
                </div>
              )}

              {live.last30 === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nobody has opened the game in the last 30 minutes.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2 text-xs" aria-label="Where they're playing, last 30 minutes">
                  {live.platforms.map((p) => (
                    <li key={p.label} className="rounded-full border border-border px-2.5 py-1">
                      {p.label} <span className="font-mono tabular-nums">{p.players}</span>
                    </li>
                  ))}
                  {shownCountries.map((c) => (
                    <li key={c.code ?? c.label} className="rounded-full border border-border px-2.5 py-1">
                      <span aria-hidden="true">{countryFlag(c.code)}</span> {c.label}{" "}
                      <span className="font-mono tabular-nums">{c.players}</span>
                    </li>
                  ))}
                  {moreCountries > 0 && (
                    <li className="rounded-full px-2.5 py-1 text-muted-foreground">
                      +{plural(moreCountries, "more country", "more countries")}
                    </li>
                  )}
                </ul>
              )}

              <p className="text-xs text-muted-foreground">
                {plural(live.newInstalls30, "new install", "new installs")} ·{" "}
                {plural(live.purchases30, "purchase", "purchases")} in the last 30 minutes · updated{" "}
                <LocalTime ms={live.fetchedAt} variant="seconds" /> · refreshes every minute
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
