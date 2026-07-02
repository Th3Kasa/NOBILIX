import "server-only";
import { JWT } from "google-auth-library";

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

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID ?? "540977563";
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export interface Ga4EventCount {
  eventName: string;
  count: number;
}

export interface Ga4Country {
  country: string;
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

async function batchRunReports(
  requests: Record<string, unknown>[],
): Promise<ReportResult[]> {
  const client = getJwtClient();
  const res = await client.request<{ reports?: ReportResult[] }>({
    url: `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:batchRunReports`,
    method: "POST",
    data: { requests },
  });
  return res.data.reports ?? [];
}

const num = (row: ReportRow | undefined, index: number): number =>
  Number(row?.metricValues?.[index]?.value ?? 0) || 0;

export async function getGa4Snapshot(): Promise<Ga4Snapshot> {
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
  };

  try {
    const last30 = [{ startDate: "30daysAgo", endDate: "today" }];
    const [activity, events, commerce, countries, acquisition] =
      await batchRunReports([
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
      ]);

    const eventCounts: Ga4EventCount[] = (events.rows ?? []).map((row) => ({
      eventName: row.dimensionValues?.[0]?.value ?? "(unknown)",
      count: num(row, 0),
    }));
    const eventCount = (name: string) =>
      eventCounts.find((e) => e.eventName === name)?.count ?? 0;

    const activityRow = activity.rows?.[0];
    const commerceRow = commerce.rows?.[0];

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
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const friendly = /403|PERMISSION_DENIED/i.test(message)
      ? "The service account has not been granted Viewer access on the GA4 property yet (Analytics Admin → Property access management)."
      : message;
    return { connected: false, ...empty, error: friendly };
  }
}
