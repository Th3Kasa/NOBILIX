import "server-only";
import { unstable_cache } from "next/cache";
import { getJwtClient, ga4PropertyId } from "./ga4-data";

/**
 * Who is playing TrapMan right now, from Google Analytics' Realtime API —
 * the same numbers as the Realtime page in Firebase / GA4. Realtime covers
 * the last 30 minutes only, minute by minute, and unlike the standard
 * reports it needs no processing delay.
 *
 * "Right now" is the last 5 minutes: GA4 counts a device as active once it
 * sends any event, and a player mid-level can go a few minutes between
 * events, so a narrower window under-counts people who are genuinely playing.
 */

export const LIVE_NOW_MINUTES = 5;
export const LIVE_WINDOW_MINUTES = 30;

export interface LiveBreakdown {
  /** Country name or platform, as Google reports it. */
  label: string;
  /** ISO 3166-1 alpha-2 for countries, so the card can show a flag. */
  code?: string;
  players: number;
}

export interface LivePlayers {
  connected: boolean;
  /** When Google was asked (epoch ms). */
  fetchedAt: number;
  /** Devices active in the last LIVE_NOW_MINUTES minutes. */
  now: number;
  /** Devices active in the last LIVE_WINDOW_MINUTES minutes. */
  last30: number;
  /** Active devices per minute, oldest first (index 0 = 29 minutes ago). */
  perMinute: number[];
  countries: LiveBreakdown[];
  platforms: LiveBreakdown[];
  /** first_open events in the window — brand-new installs opening the game. */
  newInstalls30: number;
  /** purchase events in the window. */
  purchases30: number;
  error?: string;
}

interface RealtimeRow {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
}

const metric = (row: RealtimeRow, i = 0) => Number(row.metricValues?.[i]?.value ?? 0) || 0;
const dim = (row: RealtimeRow, i = 0) => row.dimensionValues?.[i]?.value ?? "";

async function runRealtime(body: Record<string, unknown>): Promise<RealtimeRow[]> {
  const res = await getJwtClient().request<{ rows?: RealtimeRow[] }>({
    url: `https://analyticsdata.googleapis.com/v1beta/properties/${ga4PropertyId()}:runRealtimeReport`,
    method: "POST",
    data: body,
  });
  return res.data.rows ?? [];
}

const WHOLE_WINDOW = [{ startMinutesAgo: LIVE_WINDOW_MINUTES - 1, endMinutesAgo: 0 }];

/** Pure: turns GA4's sparse minutesAgo rows into a dense oldest-first series. */
export function toPerMinute(rows: RealtimeRow[], minutes = LIVE_WINDOW_MINUTES): number[] {
  const series = new Array<number>(minutes).fill(0);
  for (const row of rows) {
    const ago = Number(dim(row));
    if (Number.isInteger(ago) && ago >= 0 && ago < minutes) {
      series[minutes - 1 - ago] = metric(row);
    }
  }
  return series;
}

async function fetchLivePlayers(): Promise<LivePlayers> {
  try {
    // Separate reports, not one with every dimension: activeUsers is a
    // distinct count, so it can't be summed back up across a breakdown.
    const [totals, countries, platforms, minutes, events] = await Promise.all([
      runRealtime({
        metrics: [{ name: "activeUsers" }],
        minuteRanges: [
          { name: "now", startMinutesAgo: LIVE_NOW_MINUTES - 1, endMinutesAgo: 0 },
          { name: "window", ...WHOLE_WINDOW[0] },
        ],
      }),
      runRealtime({
        dimensions: [{ name: "countryId" }, { name: "country" }],
        metrics: [{ name: "activeUsers" }],
        minuteRanges: WHOLE_WINDOW,
      }),
      runRealtime({
        dimensions: [{ name: "platform" }],
        metrics: [{ name: "activeUsers" }],
        minuteRanges: WHOLE_WINDOW,
      }),
      runRealtime({
        dimensions: [{ name: "minutesAgo" }],
        metrics: [{ name: "activeUsers" }],
        minuteRanges: WHOLE_WINDOW,
      }),
      runRealtime({
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        minuteRanges: WHOLE_WINDOW,
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: { values: ["first_open", "purchase"] },
          },
        },
      }),
    ]);

    // With several minute ranges GA4 adds a dateRange-style dimension
    // carrying each range's name.
    const range = (name: string) => totals.find((r) => dim(r) === name);
    const eventCount = (name: string) => {
      const row = events.find((r) => dim(r) === name);
      return row ? metric(row) : 0;
    };
    const byPlayers = (a: LiveBreakdown, b: LiveBreakdown) => b.players - a.players;

    return {
      connected: true,
      fetchedAt: Date.now(),
      now: range("now") ? metric(range("now")!) : 0,
      last30: range("window") ? metric(range("window")!) : 0,
      perMinute: toPerMinute(minutes),
      countries: countries
        .map((r) => ({ code: dim(r, 0) || undefined, label: dim(r, 1) || "Unknown", players: metric(r) }))
        .sort(byPlayers),
      platforms: platforms
        .map((r) => ({ label: dim(r) || "Unknown", players: metric(r) }))
        .sort(byPlayers),
      newInstalls30: eventCount("first_open"),
      purchases30: eventCount("purchase"),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      connected: false,
      fetchedAt: Date.now(),
      now: 0,
      last30: 0,
      perMinute: [],
      countries: [],
      platforms: [],
      newInstalls30: 0,
      purchases30: 0,
      error: /403|PERMISSION_DENIED/i.test(message)
        ? "The service account can't read this Google Analytics property."
        : "Google Analytics didn't answer just now.",
    };
  }
}

/**
 * 30 s shared cache: every open console tab polls, and one Google call per
 * half-minute serves them all while keeping well inside the Realtime quota.
 */
export const getLivePlayers = unstable_cache(fetchLivePlayers, ["trapman-live-players"], {
  revalidate: 30,
  tags: ["trapman-console"],
});
