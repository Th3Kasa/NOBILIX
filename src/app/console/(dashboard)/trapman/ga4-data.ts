import "server-only";
import { unstable_cache } from "next/cache";
import { JWT } from "google-auth-library";
import { env } from "@/lib/env";
import type { StatDelta } from "@/components/stat-card";

/**
 * Google Analytics 4 data-access for the TrapMan console.
 *
 * The game's behavioural events (screen_view, session_start/end, ad_clicked,
 * first_open, purchase revenue, engagement) are collected by the Firebase
 * Analytics SDK and live in GA4 — NOT in Firestore. This module reads them
 * through the official Analytics Data API using the same service-account
 * credentials the console already uses for Firestore.
 *
 * Requirements (one-time, done in the Google consoles):
 *  - Google Analytics Data API enabled on the trap-man GCP project
 *  - The firebase-adminsdk service account granted Viewer on the GA4 property
 */

// Read lazily (function, not module constant): touching the `env` proxy
// validates the full schema, which must not happen at build time on
// machines without secrets.
const ga4PropertyId = () => env.GA4_PROPERTY_ID ?? "540977563";
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export interface Ga4EventCount {
  eventName: string;
  count: number;
}

export interface Ga4Country {
  country: string;
  activeUsers: number;
}

export interface Ga4DailyActivity {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  activeUsers: number;
}

export interface Ga4Snapshot {
  connected: boolean;
  /** Rolling active-user windows (last 30-day report range) */
  activeUsers1d: number;
  activeUsers7d: number;
  activeUsers28d: number;
  totalUsers30d: number;
  newUsers7d: number;
  /** Event counts over the last 30 days */
  events: Ga4EventCount[];
  adClicked30d: number;
  adClosed30d: number;
  /** Commerce + engagement over the last 30 days */
  totalRevenue: number;
  purchaseRevenue: number;
  avgSessionSeconds: number;
  engagedSessions: number;
  countries: Ga4Country[];
  /** Active users per day, oldest first, for the overview's activity chart. */
  dailyActivity: Ga4DailyActivity[];
  /** Period-over-period comparisons — only ever set when GA4 can compute
   *  them from a non-zero prior period; omitted rather than fabricated. */
  activeUsers7dDelta?: StatDelta;
  revenue30dDelta?: StatDelta;
  avgSessionDelta?: StatDelta;
  engagedSessionsDelta?: StatDelta;
  error?: string;
}

let jwtClient: JWT | null = null;

function getJwtClient(): JWT {
  if (jwtClient) return jwtClient;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 is not configured");
  }
  const serviceAccount = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [ANALYTICS_SCOPE],
  });
  return jwtClient;
}

interface ReportRow {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
}

interface ReportResult {
  rows?: ReportRow[];
}

/**
 * The GA4 Data API rejects a batch carrying more than 5 report requests
 * ("Batch requests are limited to 5 requests"), and one oversized batch fails
 * in full — which takes every GA4 number in the console down at once. Chunk
 * the requests and concatenate the responses so callers can pass as many
 * reports as they like and still get them back in the order they asked for.
 */
const MAX_REPORTS_PER_BATCH = 5;

async function batchRunReports(
  requests: Record<string, unknown>[],
): Promise<ReportResult[]> {
  const client = getJwtClient();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${ga4PropertyId()}:batchRunReports`;

  const batches: Record<string, unknown>[][] = [];
  for (let i = 0; i < requests.length; i += MAX_REPORTS_PER_BATCH) {
    batches.push(requests.slice(i, i + MAX_REPORTS_PER_BATCH));
  }

  // Promise.all preserves input order, so flattening rebuilds the original
  // request order that the destructuring at the call site depends on.
  const responses = await Promise.all(
    batches.map((batch) =>
      client.request<{ reports?: ReportResult[] }>({
        url,
        method: "POST",
        data: { requests: batch },
      }),
    ),
  );

  return responses.flatMap((res) => res.data.reports ?? []);
}

const num = (row: ReportRow | undefined, index: number): number =>
  Number(row?.metricValues?.[index]?.value ?? 0) || 0;

/** "20260615" (GA4's date format) → "2026-06-15". */
function formatGa4Date(raw: string | undefined): string {
  if (!raw || !/^\d{8}$/.test(raw)) return raw ?? "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function findByDateRange(
  report: ReportResult,
  key: "date_range_0" | "date_range_1",
): ReportRow | undefined {
  return report.rows?.find((r) => r.dimensionValues?.[0]?.value === key);
}

/**
 * Turns a current/previous pair into a period-over-period delta. Returns
 * undefined (never a fabricated number) when the prior period is zero and
 * the percentage would be undefined or infinite.
 */
function computeDelta(
  current: number,
  previous: number,
  label: string,
): StatDelta | undefined {
  if (previous === 0) {
    if (current === 0) return { pct: 0, direction: "flat", label };
    return undefined;
  }
  const pct = ((current - previous) / previous) * 100;
  const direction: StatDelta["direction"] =
    pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
  return { pct: Math.round(Math.abs(pct)), direction, label };
}

async function fetchGa4Snapshot(): Promise<Ga4Snapshot> {
  const empty: Omit<Ga4Snapshot, "connected" | "error"> = {
    activeUsers1d: 0,
    activeUsers7d: 0,
    activeUsers28d: 0,
    totalUsers30d: 0,
    newUsers7d: 0,
    events: [],
    adClicked30d: 0,
    adClosed30d: 0,
    totalRevenue: 0,
    purchaseRevenue: 0,
    avgSessionSeconds: 0,
    engagedSessions: 0,
    countries: [],
    dailyActivity: [],
  };

  try {
    const last30 = [{ startDate: "30daysAgo", endDate: "today" }];
    const [
      activity,
      events,
      commerce,
      countries,
      acquisition,
      dailyActivityReport,
      activeUsersDeltaReport,
      engagementDeltaReport,
    ] = await batchRunReports([
      {
        dateRanges: last30,
        metrics: [
          { name: "active1DayUsers" },
          { name: "active7DayUsers" },
          { name: "active28DayUsers" },
          { name: "totalUsers" },
        ],
      },
      {
        dateRanges: last30,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ desc: true, metric: { metricName: "eventCount" } }],
        limit: 25,
      },
      {
        dateRanges: last30,
        metrics: [
          { name: "totalRevenue" },
          { name: "purchaseRevenue" },
          { name: "averageSessionDuration" },
          { name: "engagedSessions" },
        ],
      },
      {
        dateRanges: last30,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ desc: true, metric: { metricName: "activeUsers" } }],
        limit: 8,
      },
      {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [{ name: "newUsers" }],
      },
      // Daily active-user counts for the overview's activity chart.
      {
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
      // Period-over-period: this week vs the 7 days before it. Two entries in
      // one dateRanges array is the standard GA4 Data API comparison pattern.
      // The API appends the date-range identifier (date_range_0 /
      // date_range_1) to each row automatically — it must NOT be declared as a
      // dimension, or the request is rejected with "Field dateRange is not a
      // dimension" and, because these go out in one batchRunReports call, the
      // whole batch fails and every GA4 number in the console goes dark.
      // findByDateRange() reads the auto-appended value.
      {
        dateRanges: [
          { startDate: "7daysAgo", endDate: "today" },
          { startDate: "14daysAgo", endDate: "8daysAgo" },
        ],
        metrics: [{ name: "active7DayUsers" }],
      },
      // Same comparison pattern for the 30-day commerce/engagement metrics.
      {
        dateRanges: [
          { startDate: "30daysAgo", endDate: "today" },
          { startDate: "60daysAgo", endDate: "31daysAgo" },
        ],
        metrics: [
          { name: "totalRevenue" },
          { name: "averageSessionDuration" },
          { name: "engagedSessions" },
        ],
      },
    ]);

    const eventCounts: Ga4EventCount[] = (events.rows ?? []).map((row) => ({
      eventName: row.dimensionValues?.[0]?.value ?? "(unknown)",
      count: num(row, 0),
    }));
    const eventCount = (name: string) =>
      eventCounts.find((e) => e.eventName === name)?.count ?? 0;

    const activityRow = activity.rows?.[0];
    const commerceRow = commerce.rows?.[0];

    const dailyActivity: Ga4DailyActivity[] = (dailyActivityReport.rows ?? []).map(
      (row) => ({
        date: formatGa4Date(row.dimensionValues?.[0]?.value),
        activeUsers: num(row, 0),
      }),
    );

    const activeUsers7dCurrent = num(
      findByDateRange(activeUsersDeltaReport, "date_range_0"),
      0,
    );
    const activeUsers7dPrevious = num(
      findByDateRange(activeUsersDeltaReport, "date_range_1"),
      0,
    );

    const engagementCurrent = findByDateRange(engagementDeltaReport, "date_range_0");
    const engagementPrevious = findByDateRange(engagementDeltaReport, "date_range_1");

    return {
      connected: true,
      activeUsers1d: num(activityRow, 0),
      activeUsers7d: num(activityRow, 1),
      activeUsers28d: num(activityRow, 2),
      totalUsers30d: num(activityRow, 3),
      newUsers7d: num(acquisition.rows?.[0], 0),
      events: eventCounts,
      adClicked30d: eventCount("ad_clicked"),
      adClosed30d: eventCount("ad_closed"),
      totalRevenue: num(commerceRow, 0),
      purchaseRevenue: num(commerceRow, 1),
      avgSessionSeconds: num(commerceRow, 2),
      engagedSessions: num(commerceRow, 3),
      countries: (countries.rows ?? []).map((row) => ({
        country: row.dimensionValues?.[0]?.value ?? "(unknown)",
        activeUsers: num(row, 0),
      })),
      dailyActivity,
      activeUsers7dDelta: computeDelta(
        activeUsers7dCurrent,
        activeUsers7dPrevious,
        "vs previous 7 days",
      ),
      revenue30dDelta: computeDelta(
        num(engagementCurrent, 0),
        num(engagementPrevious, 0),
        "vs previous 30 days",
      ),
      avgSessionDelta: computeDelta(
        num(engagementCurrent, 1),
        num(engagementPrevious, 1),
        "vs previous 30 days",
      ),
      engagedSessionsDelta: computeDelta(
        num(engagementCurrent, 2),
        num(engagementPrevious, 2),
        "vs previous 30 days",
      ),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const friendly = /403|PERMISSION_DENIED/i.test(message)
      ? "The service account has not been granted Viewer access on the GA4 property yet (Analytics Admin → Property access management)."
      : message;
    return { connected: false, ...empty, error: friendly };
  }
}

/**
 * 60s shared cache: the GA4 Data API has daily token quotas, and its
 * figures only move on Google's processing cadence anyway — refreshing
 * more often than once a minute buys nothing. (unstable_cache is
 * deprecated in favour of "use cache"; app-wide migration out of scope.)
 */
export const getGa4Snapshot = unstable_cache(
  fetchGa4Snapshot,
  ["trapman-ga4"],
  { revalidate: 60, tags: ["trapman-console"] },
);
