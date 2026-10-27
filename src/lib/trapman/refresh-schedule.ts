/**
 * When the console refreshes each data source, and when each source itself
 * publishes new data — the single source of truth for both the daily job
 * (vercel.json → /api/cron/daily-refresh) and the "next update" times the
 * console shows. A test keeps vercel.json's schedule in step with this file.
 *
 * Pure and client-safe: no server imports, so the freshness panel can use it.
 */

/** The daily job's path, as registered in vercel.json. */
export const DAILY_REFRESH_PATH = "/api/cron/daily-refresh";

/**
 * 17:00 UTC (9–10 am in California, 1 am in Perth). Apple publishes the
 * previous Pacific day's sales report early that morning in California, so by
 * now it is out; running earlier risks finding nothing and waiting a full day.
 */
export const DAILY_REFRESH_UTC_HOUR = 17;

/** The cron expression vercel.json must carry. */
export const DAILY_REFRESH_CRON = `0 ${DAILY_REFRESH_UTC_HOUR} * * *`;

/** The next run of the daily job strictly after `now` (epoch ms). */
export function nextDailyRefresh(now: number): number {
  const d = new Date(now);
  const today = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    DAILY_REFRESH_UTC_HOUR,
  );
  return today > now ? today : today + 24 * 60 * 60 * 1000;
}

/** Live sources: how often the console re-reads them. */
export const LIVE_REFRESH = {
  /** The game's database (player snapshot cache). */
  firestoreSeconds: 120,
  /** Google Analytics (snapshot cache). */
  ga4Seconds: 60,
} as const;
