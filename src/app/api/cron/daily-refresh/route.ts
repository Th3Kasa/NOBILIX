import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { refreshAppleSales } from "@/lib/trapman/app-store-connect";
import { refreshPlaySales } from "@/lib/trapman/play-reports";
import { STORE_REPORTS_TAG } from "@/lib/trapman/store-reports";
import { writeSyncStatus, type SourceSyncResult } from "@/lib/trapman/sync-status";

/**
 * The daily refresh, run by Vercel Cron (see vercel.json and
 * lib/trapman/refresh-schedule). Pulls every new Apple and Google Play report
 * into the console's Firestore cache, so the figures are current before anyone
 * opens the console, and records the outcome for the freshness panel.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without CRON_SECRET set
 * the route refuses everyone: an open endpoint would let anyone spend the
 * Apple and Google API quotas.
 */

export const dynamic = "force-dynamic";
/** Apple serves one day per request; a first fill is ~30 sequential downloads. */
export const maxDuration = 60;

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { error: "CRON_SECRET is not set, so the daily refresh is switched off." },
      { status: 503 },
    );
  }
  if (!authorised(req)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const [apple, play] = await Promise.all([refreshAppleSales(30), refreshPlaySales()]);

  const appleResult: SourceSyncResult = {
    ok: apple.connected && !apple.error,
    latestDate: apple.latestReportDate,
    error: apple.configured ? (apple.error ?? null) : "App Store Connect is not connected.",
  };
  const playLatest =
    [play.latestSaleDate, play.installs?.latestDate]
      .filter((d): d is string => !!d)
      .sort()
      .at(-1) ?? null;
  const playResult: SourceSyncResult = {
    ok: play.connected && !play.error,
    latestDate: playLatest,
    error: play.configured ? (play.error ?? null) : "Google Play reports are not connected.",
  };

  const status = { ranAt: Date.now(), apple: appleResult, play: playResult };
  await writeSyncStatus(status);
  // The pages cache store figures for up to an hour; drop that now so the
  // next visit shows what was just downloaded, not this morning's copy.
  revalidateTag(STORE_REPORTS_TAG, { expire: 0 });
  revalidateTag("trapman-sync-status", { expire: 0 });
  return Response.json(status);
}
