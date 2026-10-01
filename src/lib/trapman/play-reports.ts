import "server-only";
import { createHash } from "node:crypto";
import { JWT } from "google-auth-library";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";
import {
  summariseStoreSales,
  type AppleSalesRow,
  type StoreSalesSummary,
} from "@/lib/trapman/store-reports";
import {
  classifyPlayObject,
  decodeReportText,
  parsePlayEarnings,
  parsePlayInstalls,
  parsePlaySales,
  playMonths,
  type PlayInstallDay,
  type PlayMonthEarnings,
  type PlayReportKind,
} from "@/lib/trapman/play-reports-parse";
import { readZipCsvs } from "@/lib/trapman/zip";

/**
 * Google Play downloads, sales and earnings, read from the account's reports
 * bucket (Play Console → Download reports → Cloud Storage URI).
 *
 * Access is granted in Play Console, not Google Cloud: the service account is
 * invited under Users and permissions with "View app information and download
 * bulk reports" and "View financial data". Until that invitation lands the
 * bucket answers 403 and the panel says exactly that.
 *
 * Google rewrites the current month's files daily and freezes them once the
 * month closes, so each file is cached in Firestore with its storage
 * `generation` and only downloaded again when Google has replaced it.
 */

const STORAGE_SCOPE = "https://www.googleapis.com/auth/devstorage.read_only";
const STORAGE_API = "https://storage.googleapis.com/storage/v1";
const DEFAULT_PACKAGE = "com.cultshotta.trapman";
/** Months of files read: the current one plus the two before it. */
const MONTHS = 3;
/** Installs and sales are summarised over this many days. */
export const PLAY_WINDOW_DAYS = 30;
/** Bound the downloads one refresh can trigger; the rest follow next refresh. */
const MAX_DOWNLOADS_PER_PASS = 6;

// ─── Credentials ─────────────────────────────────────────────────────────────

let storageClient: JWT | null | undefined;

/** Same service account as Play purchase verification, with a read-only storage scope. */
function getStorageClient(): JWT | null {
  if (storageClient !== undefined) return storageClient;
  const b64 =
    process.env.ANDROID_PUBLISHER_SERVICE_ACCOUNT_B64 ||
    process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  try {
    const sa = b64 ? JSON.parse(Buffer.from(b64, "base64").toString("utf8")) : null;
    storageClient = sa
      ? new JWT({ email: sa.client_email, key: sa.private_key, scopes: [STORAGE_SCOPE] })
      : null;
  } catch {
    storageClient = null;
  }
  return storageClient;
}

function readConfig() {
  const bucket = process.env.PLAY_REPORTS_BUCKET?.replace(/^gs:\/\//, "").split("/")[0];
  const packageName = process.env.PLAY_PACKAGE_NAME || DEFAULT_PACKAGE;
  const client = getStorageClient();
  return bucket && client ? { bucket, packageName, client } : null;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

interface StorageObject {
  name: string;
  generation: string;
}

function statusOf(err: unknown): number | undefined {
  const e = err as { response?: { status?: number }; status?: number; code?: number | string };
  return e.response?.status ?? e.status ?? (typeof e.code === "number" ? e.code : undefined);
}

/** Google's own explanation from an error response, when it sent one. */
function googleReason(err: unknown): string | undefined {
  const data = (err as { response?: { data?: unknown } }).response?.data;
  let body: unknown = data;
  const text =
    data instanceof ArrayBuffer
      ? Buffer.from(data).toString("utf8")
      : typeof data === "string"
        ? data
        : null;
  if (text !== null) {
    try {
      body = JSON.parse(text);
    } catch {
      return text.slice(0, 300) || undefined;
    }
  }
  const message = (body as { error?: { message?: unknown } } | undefined)?.error?.message;
  return typeof message === "string" ? message : undefined;
}

function describeError(err: unknown): string {
  const status = statusOf(err);
  const reason = googleReason(err);
  const said = reason ? ` Google said: "${reason}"` : "";
  if (status === 401) {
    return `Google rejected the console's service account key. Check FIREBASE_SERVICE_ACCOUNT_B64 in Vercel.${said}`;
  }
  if (status === 403 && reason && /has not been used|is disabled|SERVICE_DISABLED/i.test(reason)) {
    return `Google Cloud Storage is switched off for the trap-man project. In console.cloud.google.com, open project trap-man and enable "Cloud Storage JSON API".${said}`;
  }
  if (status === 403) {
    return `Google is refusing access to the Play reports. The service account (firebase-adminsdk-fbsvc@trap-man.iam.gserviceaccount.com) needs "View app information and download bulk reports" and "View financial data" in Play Console → Users and permissions — and once granted, Google can take up to 24 hours to apply it to the reports.${said}`;
  }
  if (status === 404) {
    return "That reports bucket doesn't exist. Copy the Cloud Storage URI from Play Console → Download reports into PLAY_REPORTS_BUCKET.";
  }
  return err instanceof Error ? err.message : "Could not reach Google Cloud Storage.";
}

async function listObjects(client: JWT, bucket: string, prefix: string): Promise<StorageObject[]> {
  const out: StorageObject[] = [];
  let pageToken: string | undefined;
  do {
    const res = await client.request<{
      items?: StorageObject[];
      nextPageToken?: string;
    }>({
      url: `${STORAGE_API}/b/${encodeURIComponent(bucket)}/o`,
      params: {
        prefix,
        fields: "items(name,generation),nextPageToken",
        ...(pageToken ? { pageToken } : {}),
      },
    });
    out.push(...(res.data.items ?? []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return out;
}

async function download(client: JWT, bucket: string, name: string): Promise<Uint8Array> {
  const res = await client.request<ArrayBuffer>({
    url: `${STORAGE_API}/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(name)}`,
    params: { alt: "media" },
    responseType: "arraybuffer",
  });
  return new Uint8Array(res.data);
}

// ─── Cache ───────────────────────────────────────────────────────────────────

/** One parsed report file. Only the aggregates are stored, never raw orders. */
interface CachedFile {
  objectName: string;
  generation: string;
  kind: PlayReportKind;
  month: string;
  installs?: PlayInstallDay[];
  sales?: AppleSalesRow[];
  earnings?: PlayMonthEarnings | null;
  /** The file was readable but its columns weren't recognised. */
  unreadable?: boolean;
  fetchedAt: number;
}

const docId = (objectName: string) =>
  `play-${createHash("sha1").update(objectName).digest("hex").slice(0, 24)}`;

async function readCache(names: string[]): Promise<Map<string, CachedFile>> {
  const found = new Map<string, CachedFile>();
  if (names.length === 0) return found;
  try {
    const db = getDb();
    const docs = await db.getAll(
      ...names.map((n) => db.collection(CRM.storeReports).doc(docId(n))),
    );
    for (const doc of docs) {
      const data = doc.data() as CachedFile | undefined;
      if (data?.objectName) found.set(data.objectName, data);
    }
  } catch {
    // A cache miss only costs a download.
  }
  return found;
}

async function writeCache(files: CachedFile[]): Promise<void> {
  if (files.length === 0) return;
  try {
    const db = getDb();
    const batch = db.batch();
    for (const f of files) batch.set(db.collection(CRM.storeReports).doc(docId(f.objectName)), f);
    await batch.commit();
  } catch {
    // Losing the write only means downloading again next time.
  }
}

/**
 * Merge sales rows that are identical apart from units, so a month of orders
 * stays far below Firestore's 1 MiB document limit. Units × per-unit price is
 * preserved exactly, which is all the summary uses.
 */
function compactRows(rows: AppleSalesRow[]): AppleSalesRow[] {
  const merged = new Map<string, AppleSalesRow>();
  for (const r of rows) {
    const key = [r.beginDate, r.sku, r.productTypeIdentifier, r.currencyOfProceeds, r.developerProceeds, r.countryCode, Math.sign(r.units)].join("|");
    const existing = merged.get(key);
    if (existing) existing.units += r.units;
    else merged.set(key, { ...r });
  }
  return [...merged.values()];
}

async function parseFile(
  client: JWT,
  bucket: string,
  obj: StorageObject,
  kind: PlayReportKind,
  month: string,
  packageName: string,
): Promise<CachedFile> {
  const bytes = await download(client, bucket, obj.name);
  const base = { objectName: obj.name, generation: obj.generation, kind, month, fetchedAt: Date.now() };

  if (kind === "installs") {
    const installs = parsePlayInstalls(decodeReportText(bytes), packageName);
    return installs ? { ...base, installs } : { ...base, unreadable: true };
  }
  const csvs = readZipCsvs(bytes).map((f) => decodeReportText(f.bytes));
  if (kind === "sales") {
    const parsed = csvs.map((c) => parsePlaySales(c, packageName));
    if (parsed.every((p) => p === null)) return { ...base, unreadable: true };
    return { ...base, sales: compactRows(parsed.flatMap((p) => p ?? [])) };
  }
  const earnings = parsePlayEarnings(csvs, month, packageName);
  return earnings ? { ...base, earnings } : { ...base, unreadable: true };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PlaySalesData {
  configured: boolean;
  connected: boolean;
  /** Installs over the last PLAY_WINDOW_DAYS days. */
  installs: {
    newUsers: number;
    uninstalls: number;
    /** Devices with the game installed on the latest reported day. */
    activeDevices: number | null;
    latestDate: string | null;
  } | null;
  /** Orders over the last PLAY_WINDOW_DAYS days, at the price the buyer paid (before Google's fee). */
  sales: StoreSalesSummary | null;
  latestSaleDate: string | null;
  /** Payouts after Google's fee and tax, one entry per month, newest first. */
  earnings: PlayMonthEarnings[];
  /** Some files were left for the next refresh. */
  backfilling: boolean;
  /** Report files whose columns weren't recognised. */
  unreadableFiles: string[];
  error?: string;
}

const emptyPlay = (patch: Partial<PlaySalesData> = {}): PlaySalesData => ({
  configured: false,
  connected: false,
  installs: null,
  sales: null,
  latestSaleDate: null,
  earnings: [],
  backfilling: false,
  unreadableFiles: [],
  ...patch,
});

function mergeEarnings(parts: PlayMonthEarnings[]): PlayMonthEarnings[] {
  const byMonth = new Map<string, PlayMonthEarnings>();
  for (const p of parts) {
    const m = byMonth.get(p.month);
    if (!m) {
      byMonth.set(p.month, { ...p, byProduct: p.byProduct.map((x) => ({ ...x })) });
      continue;
    }
    m.net = Math.round((m.net + p.net) * 100) / 100;
    m.gross = Math.round((m.gross + p.gross) * 100) / 100;
    m.currency ||= p.currency;
    for (const prod of p.byProduct) {
      const existing = m.byProduct.find((x) => x.sku === prod.sku);
      if (existing) existing.net = Math.round((existing.net + prod.net) * 100) / 100;
      else m.byProduct.push({ ...prod });
    }
  }
  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));
}

/** Throws PlayAccessError when the bucket cannot be listed; see getPlaySales. */
async function loadPlaySales(): Promise<PlaySalesData> {
  const config = readConfig();
  if (!config) return emptyPlay();
  const { bucket, packageName, client } = config;

  const now = Date.now();
  const months = new Set(playMonths(now, MONTHS));
  const cutoff = new Date(now - PLAY_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);

  let objects: (StorageObject & { kind: PlayReportKind; month: string })[];
  try {
    const listed = (
      await Promise.all(
        [`stats/installs/installs_${packageName}_`, "sales/salesreport_", "earnings/earnings_"].map(
          (prefix) => listObjects(client, bucket, prefix),
        ),
      )
    ).flat();
    objects = listed.flatMap((o) => {
      const c = classifyPlayObject(o.name, packageName);
      return c && months.has(c.month) ? [{ ...o, ...c }] : [];
    });
  } catch (err) {
    // Thrown rather than returned so the 10-minute cache below never holds on
    // to a failure: the moment Google grants access, the next load sees it.
    throw new PlayAccessError(describeError(err));
  }

  const cached = await readCache(objects.map((o) => o.name));
  // Newest first, so a capped pass fills in the current month before old ones.
  const stale = objects
    .filter((o) => cached.get(o.name)?.generation !== o.generation)
    .sort((a, b) => b.month.localeCompare(a.month));

  const fresh: CachedFile[] = [];
  let failure: string | undefined;
  for (const obj of stale.slice(0, MAX_DOWNLOADS_PER_PASS)) {
    try {
      fresh.push(await parseFile(client, bucket, obj, obj.kind, obj.month, packageName));
    } catch (err) {
      failure = describeError(err);
      break;
    }
  }
  await writeCache(fresh);

  const files = new Map(cached);
  for (const f of fresh) files.set(f.objectName, f);
  const current = objects.map((o) => files.get(o.name)).filter((f): f is CachedFile => !!f);

  const installDays = current
    .flatMap((f) => f.installs ?? [])
    .filter((d) => d.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
  const saleRows = current.flatMap((f) => f.sales ?? []).filter((r) => r.beginDate >= cutoff);
  const latestInstall = installDays.at(-1);

  return {
    configured: true,
    connected: true,
    installs: installDays.length
      ? {
          newUsers: installDays.reduce((n, d) => n + d.userInstalls, 0),
          uninstalls: installDays.reduce((n, d) => n + d.userUninstalls, 0),
          activeDevices: latestInstall?.activeDevices || null,
          latestDate: latestInstall?.date ?? null,
        }
      : null,
    sales: saleRows.length ? summariseStoreSales(saleRows) : null,
    latestSaleDate: saleRows.map((r) => r.beginDate).sort().at(-1) ?? null,
    earnings: mergeEarnings(current.flatMap((f) => (f.earnings ? [f.earnings] : []))),
    backfilling: stale.length > MAX_DOWNLOADS_PER_PASS || !!failure,
    unreadableFiles: current.filter((f) => f.unreadable).map((f) => f.objectName),
    error: failure,
  };
}

/** The bucket could not be listed at all. Carries the operator-facing reason. */
class PlayAccessError extends Error {}

/**
 * Successful reads are cached for 10 minutes: the files change at most daily,
 * and the Purchases page auto-refreshes far more often than that. Failures are
 * never cached (unstable_cache does not store a thrown error).
 */
const loadPlaySalesCached = unstable_cache(loadPlaySales, ["trapman-play-reports"], {
  revalidate: 600,
  tags: ["trapman-console"],
});

/** Never throws: every failure degrades to a panel that explains itself. */
export async function getPlaySales(): Promise<PlaySalesData> {
  if (!readConfig()) return emptyPlay();
  try {
    return await loadPlaySalesCached();
  } catch (err) {
    return emptyPlay({
      configured: true,
      error:
        err instanceof PlayAccessError
          ? err.message
          : `Could not read the Play reports: ${err instanceof Error ? err.message : "unknown error"}`,
    });
  }
}
