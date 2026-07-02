import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";

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

function isParsablePurchase(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === "string" &&
    typeof v.price === "number" &&
    typeof v.currency === "string"
  );
}

export async function getLiveMetrics(): Promise<LiveMetrics> {
  try {
    const db = getDb();
    const [usersSnap, boardSnap] = await Promise.all([
      db.collection(GAME.users).limit(MAX_SAMPLE).get(),
      db
        .collection(GAME.leaderboard)
        .orderBy("timestamp", "desc")
        .limit(8)
        .get(),
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

      if (typeof data.purchases === "object" && data.purchases !== null) {
        for (const record of Object.values(data.purchases as Record<string, unknown>)) {
          if (isParsablePurchase(record)) {
            const r = record as { price: number; currency: string };
            purchaseCount += 1;
            buyers.add(doc.id);
            const cur = r.currency.toUpperCase();
            revenue.set(cur, (revenue.get(cur) ?? 0) + r.price);
          }
        }
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
