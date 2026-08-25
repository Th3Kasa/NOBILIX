import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";
import { parsePurchaseMap } from "@/lib/trapman/purchases";
import { getTestAccountUids } from "@/lib/trapman/test-accounts";

/**
 * Supplemental live metrics for the TrapMan Mission Control overview.
 *
 * Reads directly from the confirmed live collections (`users`,
 * `leaderboard`) on every request. All fields below are engineering-confirmed
 * via schema review: users.fcmToken, users.currentLevel, users.completedLevels,
 * users.purchases (embedded map), leaderboard.{username,score,timestamp,country}.
 */

const MAX_SAMPLE = 1000;

export interface ActivityEntry {
  username: string;
  country: string | null;
  score: number;
  timestamp: number;
}

export interface LiveMetrics {
  connected: boolean;
  pushReachable: number;
  purchaseCount: number;
  buyerCount: number;
  topRevenue: { currency: string; total: number } | null;
  revenueByCurrency: { currency: string; total: number }[];
  maxLevelReached: number | null;
  avgCompletedLevels: number | null;
  recentActivity: ActivityEntry[];
  latestActivityAt: number | null;
  error?: string;
}

async function fetchLiveMetrics(): Promise<LiveMetrics> {
  try {
    const db = getDb();
    const [usersSnap, boardSnap, testUids] = await Promise.all([
      db.collection(GAME.users).limit(MAX_SAMPLE).get(),
      db
        .collection(GAME.leaderboard)
        .orderBy("timestamp", "desc")
        .limit(8)
        .get(),
      getTestAccountUids(),
    ]);

    let pushReachable = 0;
    let purchaseCount = 0;
    const buyers = new Set<string>();
    const revenue = new Map<string, number>();
    let maxLevel: number | null = null;
    let completedTotal = 0;
    let completedSamples = 0;

    for (const doc of usersSnap.docs) {
      const data = doc.data();

      if (typeof data.fcmToken === "string" && data.fcmToken.length > 0) {
        pushReachable += 1;
      }

      if (typeof data.currentLevel === "number") {
        maxLevel = maxLevel == null ? data.currentLevel : Math.max(maxLevel, data.currentLevel);
      }
      if (Array.isArray(data.completedLevels)) {
        completedTotal += data.completedLevels.length;
        completedSamples += 1;
      }

      // Shared parser: handles both the Apple (flat) and Google (nested)
      // shapes, so this figure cannot drift from the Purchases page.
      const { purchases } = parsePurchaseMap(doc.id, null, data.purchases);
      for (const p of purchases) {
        // Editor sessions never reached a store, and registered testers are
        // the studio's own activity — neither is revenue.
        if (p.isEditorPurchase || testUids.has(p.buyerUid)) continue;
        purchaseCount += 1;
        buyers.add(doc.id);
        revenue.set(p.currency, (revenue.get(p.currency) ?? 0) + p.price);
      }
    }

    const revenueEntries = Array.from(revenue.entries()).sort((a, b) => b[1] - a[1]);
    const topRevenueEntry = revenueEntries[0];

    const recentActivity: ActivityEntry[] = boardSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        username: typeof d.username === "string" ? d.username : "(unknown)",
        country: typeof d.country === "string" ? d.country : null,
        score: typeof d.score === "number" ? d.score : 0,
        timestamp: typeof d.timestamp === "number" ? d.timestamp : 0,
      };
    });

    return {
      connected: true,
      pushReachable,
      purchaseCount,
      buyerCount: buyers.size,
      topRevenue: topRevenueEntry
        ? { currency: topRevenueEntry[0], total: topRevenueEntry[1] }
        : null,
      revenueByCurrency: revenueEntries.map(([currency, total]) => ({
        currency,
        total,
      })),
      maxLevelReached: maxLevel,
      avgCompletedLevels:
        completedSamples > 0
          ? Math.round((completedTotal / completedSamples) * 10) / 10
          : null,
      recentActivity,
      latestActivityAt: recentActivity[0]?.timestamp ?? null,
    };
  } catch (err) {
    return {
      connected: false,
      pushReachable: 0,
      purchaseCount: 0,
      buyerCount: 0,
      topRevenue: null,
      revenueByCurrency: [],
      maxLevelReached: null,
      avgCompletedLevels: null,
      recentActivity: [],
      latestActivityAt: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * 30s shared cache, matching the dashboard's auto-refresh cadence: each
 * tick serves every admin from ONE 1,000-doc scan instead of a scan per
 * admin per request. (unstable_cache is deprecated in favour of "use
 * cache", but that requires opting the whole app into cacheComponents —
 * a separate migration.)
 */
export const getLiveMetrics = unstable_cache(
  fetchLiveMetrics,
  ["trapman-live-metrics"],
  { revalidate: 30, tags: ["trapman-console"] },
);
