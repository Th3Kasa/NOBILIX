import "server-only";
import { createSign } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";
import {
  parseAppleSalesReport,
  summariseStoreSales,
  reportDateRange,
  type AppleSalesRow,
  type StoreSalesSummary,
} from "@/lib/trapman/store-reports";

/**
 * Reads Apple's Sales and Trends reports through the App Store Connect API.
 *
 * This is the only way the console can report iOS sales honestly. TrapMan
 * writes an empty `receipt` for every iPhone purchase, so no individual iOS
 * transaction can be verified with Apple — but Sales and Trends is aggregate,
 * keyed by date and SKU, so Apple will still tell us exactly how many units
 * sold and what we earned. It arrives already net of refunds and excludes
 * sandbox/TestFlight purchases entirely, which is precisely the "remove the
 * test purchases" problem we could not otherwise solve on iOS.
 *
 * Trade-off worth knowing: these reports are daily and land roughly a day in
 * arrears, so this is authoritative but not real-time. The console labels it
 * as such rather than implying the numbers are current to the minute.
 *
 * Auth is a short-lived ES256 JWT signed with the App Store Connect private
 * key — Apple does not issue long-lived tokens. Node can produce the raw R||S
 * signature JOSE requires directly via `dsaEncoding: "ieee-p1363"`, so no JWT
 * dependency is needed.
 */

const API_ROOT = "https://api.appstoreconnect.apple.com/v1";
/** Apple rejects tokens with a lifetime over 20 minutes. */
const TOKEN_TTL_SECONDS = 15 * 60;
/** Bound how many daily reports one refresh will pull. */
const MAX_DAYS_PER_PASS = 35;

export interface AppleCredentials {
  issuerId: string;
  keyId: string;
  /** PEM contents of the .p8 private key. */
  privateKey: string;
  vendorNumber: string;
}

function readCredentials(): AppleCredentials | null {
  const issuerId = process.env.APPSTORE_ISSUER_ID;
  const keyId = process.env.APPSTORE_KEY_ID;
  const vendorNumber = process.env.APPSTORE_VENDOR_NUMBER;
  const keyB64 = process.env.APPSTORE_PRIVATE_KEY_B64;
  if (!issuerId || !keyId || !vendorNumber || !keyB64) return null;

  try {
    // The .p8 is stored base64-encoded so the PEM's newlines survive being an
    // environment variable — the same reason the Firebase key is stored that way.
    const privateKey = Buffer.from(keyB64, "base64").toString("utf8");
    if (!privateKey.includes("PRIVATE KEY")) return null;
    return { issuerId, keyId, privateKey, vendorNumber };
  } catch {
    return null;
  }
}

export function isAppStoreConfigured(): boolean {
  return readCredentials() !== null;
}

const base64url = (input: Buffer | string): string =>
  Buffer.from(input).toString("base64url");

/**
 * Mint a short-lived ES256 token for the App Store Connect API.
 *
 * `aud` must be exactly "appstoreconnect-v1" and the token must carry the key
 * id in the header; Apple rejects the request outright otherwise.
 */
function createToken(creds: AppleCredentials): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(
    JSON.stringify({ alg: "ES256", kid: creds.keyId, typ: "JWT" }),
  );
  const payload = base64url(
    JSON.stringify({
      iss: creds.issuerId,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
      aud: "appstoreconnect-v1",
    }),
  );
  const signature = createSign("SHA256")
    .update(`${header}.${payload}`)
    .sign({ key: creds.privateKey, dsaEncoding: "ieee-p1363" });

  return `${header}.${payload}.${base64url(signature)}`;
}

/** Turn Apple's HTTP failures into something an operator can act on. */
function describeError(status: number, body: string): string {
  if (status === 401) {
    return "Apple rejected the console's API key. Check the Issuer ID, Key ID and .p8 key are from the same App Store Connect account.";
  }
  if (status === 403) {
    return "The App Store Connect key does not have permission to read sales reports. It needs the Admin, Finance or Sales role.";
  }
  if (status === 404) {
    // Apple returns 404 for "no report exists", which is normal for a day with
    // no sales — the caller treats it as an empty day, not a failure.
    return "No report published for that day.";
  }
  if (status === 429) {
    return "Apple is rate-limiting report downloads. The console will try again on the next refresh.";
  }
  const detail = body.slice(0, 300).replace(/\s+/g, " ").trim();
  return `Apple returned ${status}${detail ? `: ${detail}` : ""}`;
}

/** A report Apple refused to serve, carrying an operator-readable reason. */
class ReportUnavailable extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ReportUnavailable";
    this.status = status;
  }
}

/**
 * Download one day's SALES/SUMMARY report.
 *
 * Returns null when Apple has no report for that date, which is an ordinary
 * outcome — a day with no sales simply has no report — and must not be
 * reported to the operator as an error.
 */
async function fetchDailyReport(
  creds: AppleCredentials,
  date: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    "filter[frequency]": "DAILY",
    "filter[reportType]": "SALES",
    "filter[reportSubType]": "SUMMARY",
    "filter[vendorNumber]": creds.vendorNumber,
    "filter[reportDate]": date,
  });

  const res = await fetch(`${API_ROOT}/salesReports?${params}`, {
    headers: {
      Authorization: `Bearer ${createToken(creds)}`,
      Accept: "application/a-gzip",
    },
    // Reports are immutable once published; our own cache handles reuse.
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ReportUnavailable(
      res.status,
      describeError(res.status, await res.text().catch(() => "")),
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) return null;

  try {
    return gunzipSync(buffer).toString("utf8");
  } catch {
    // Apple occasionally serves an uncompressed body despite the Accept header.
    return buffer.toString("utf8");
  }
}

// ─── Cache ───────────────────────────────────────────────────────────────────

/**
 * A published daily report never changes, so a day once fetched is cached
 * permanently. Only the most recent days are ever re-requested, which keeps
 * this well inside Apple's rate limits even on a fast auto-refresh.
 */
interface CachedDay {
  date: string;
  rows: AppleSalesRow[];
  /** True when Apple confirmed there is simply no report for this day. */
  empty: boolean;
  fetchedAt: number;
}

function dayDocId(vendorNumber: string, date: string): string {
  return `apple-${vendorNumber}-${date}`;
}

async function readCachedDays(
  vendorNumber: string,
  dates: string[],
): Promise<Map<string, CachedDay>> {
  const found = new Map<string, CachedDay>();
  if (dates.length === 0) return found;
  try {
    const db = getDb();
    const refs = dates.map((d) =>
      db.collection(CRM.storeReports).doc(dayDocId(vendorNumber, d)),
    );
    const docs = await db.getAll(...refs);
    for (const doc of docs) {
      if (!doc.exists) continue;
      const data = doc.data() as CachedDay | undefined;
      if (data?.date) found.set(data.date, data);
    }
  } catch {
    // A cache miss only costs an extra request.
  }
  return found;
}

async function writeCachedDays(
  vendorNumber: string,
  days: CachedDay[],
): Promise<void> {
  if (days.length === 0) return;
  try {
    const db = getDb();
    const batch = db.batch();
    for (const day of days) {
      batch.set(
        db.collection(CRM.storeReports).doc(dayDocId(vendorNumber, day.date)),
        day,
      );
    }
    await batch.commit();
  } catch {
    // Losing the write only means re-fetching next time.
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface AppleSalesData {
  configured: boolean;
  connected: boolean;
  summary: StoreSalesSummary | null;
  /** ISO date of the most recent day Apple had data for. */
  latestReportDate: string | null;
  /** Days requested that Apple had no report for (usually zero-sale days). */
  daysWithNoReport: number;
  error?: string;
}

const emptyAppleSales = (
  patch: Partial<AppleSalesData> = {},
): AppleSalesData => ({
  configured: false,
  connected: false,
  summary: null,
  latestReportDate: null,
  daysWithNoReport: 0,
  ...patch,
});

/**
 * Apple's own account of iOS sales over the last `days` days.
 *
 * Never throws: a missing key, a rejected key or a rate limit all degrade to
 * `connected: false` with an explanation, so the page renders and says what is
 * wrong instead of going blank.
 */
export async function getAppleSales(days = 30): Promise<AppleSalesData> {
  const creds = readCredentials();
  if (!creds) return emptyAppleSales();

  const dates = reportDateRange(Date.now(), Math.min(days, MAX_DAYS_PER_PASS));
  const cached = await readCachedDays(creds.vendorNumber, dates);
  const missing = dates.filter((d) => !cached.has(d));

  const fetched: CachedDay[] = [];
  let failure: string | null = null;

  for (const date of missing) {
    try {
      const tsv = await fetchDailyReport(creds, date);
      fetched.push({
        date,
        rows: tsv ? parseAppleSalesReport(tsv) : [],
        empty: tsv === null,
        fetchedAt: Date.now(),
      });
    } catch (err) {
      // One bad day must not discard the days that did come back. Stop asking
      // after the first hard failure — the cause (auth, rate limit) applies to
      // every subsequent request too, and hammering Apple would make it worse.
      failure =
        err instanceof ReportUnavailable
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not reach Apple.";
      break;
    }
  }

  await writeCachedDays(creds.vendorNumber, fetched);

  const allDays = [...cached.values(), ...fetched];
  if (allDays.length === 0) {
    return emptyAppleSales({
      configured: true,
      error: failure ?? "No sales reports could be read.",
    });
  }

  const rows = allDays.flatMap((d) => d.rows);
  const withData = allDays.filter((d) => d.rows.length > 0);
  const latestReportDate =
    withData.map((d) => d.date).sort().at(-1) ?? null;

  return {
    configured: true,
    connected: true,
    summary: summariseStoreSales(rows),
    latestReportDate,
    daysWithNoReport: allDays.filter((d) => d.empty).length,
    // A partial failure is still worth surfacing alongside the data we have.
    error: failure ?? undefined,
  };
}
