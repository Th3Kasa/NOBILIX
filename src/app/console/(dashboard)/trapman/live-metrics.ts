import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";
import { getPlayerScan } from "@/lib/trapman/player-scan";
import { average } from "@/lib/trapman/player-fields";

/**
 * Live player metrics for the TrapMan overview.
 *
 * Player figures come from the shared player snapshot (see player-scan), read
 * through the same field rules as the Players, Gameplay and Push tabs, so the
 * Overview can never disagree with them. Purchase figures are not computed
 * here at all: the Overview uses the Purchases page's own accounting.
 */

export interface ActivityEntry {
  name: string;
  country: string | null;
  score: number;
  timestamp: number;
}

export interface LiveMetrics {
  connected: boolean;
  /** Players in the snapshot. */
  players: number;
  scanCapped: boolean;
  /** Players with a push token (notifications allowed). */
  pushReachable: number;
  /** The furthest level any player has reached (current or completed). */
  highestLevel: number | null;
  /** Average number of distinct levels completed per player. */
  avgLevelsCompleted: number | null;
  recentActivity: ActivityEntry[];
  latestActivityAt: number | null;
  error?: string;
}

/** Placeholder rows seeded onto the board for testing; never real players. */
const isSeedRow = (id: string) => id.startsWith("seed_");

async function fetchRecentScores(): Promise<ActivityEntry[]> {
  const snap = await getDb()
    .collection(GAME.leaderboard)
    .orderBy("timestamp", "desc")
    .limit(12)
    .get();
  return snap.docs
    .filter((doc) => !isSeedRow(doc.id))
    .slice(0, 8)
    .map((doc) => {
      const d = doc.data();
      const name = [d.username, d.displayName, d.name].find(
        (v) => typeof v === "string" && v.trim(),
      ) as string | undefined;
      return {
        name: name?.trim() ?? `${doc.id.slice(0, 8)}…`,
        country:
          typeof d.country === "string" && d.country.trim()
            ? d.country.trim().toUpperCase()
            : null,
        score:
          typeof d.score === "number"
            ? d.score
            : typeof d.highScore === "number"
              ? d.highScore
              : 0,
        timestamp: typeof d.timestamp === "number" ? d.timestamp : 0,
      };
    });
}

/** Cached 60s: the latest-scores strip is a small read but runs on every refresh. */
const getRecentScores = unstable_cache(fetchRecentScores, ["trapman-recent-scores"], {
  revalidate: 60,
  tags: ["trapman-console"],
});

export async function getLiveMetrics(): Promise<LiveMetrics> {
  const [scan, recent] = await Promise.all([
    getPlayerScan(),
    getRecentScores().catch(() => [] as ActivityEntry[]),
  ]);
  if (!scan.connected) {
    return {
      connected: false,
      players: 0,
      scanCapped: false,
      pushReachable: 0,
      highestLevel: null,
      avgLevelsCompleted: null,
      recentActivity: [],
      latestActivityAt: null,
      error: scan.error,
    };
  }

  const highest = scan.players
    .map((p) => p.highestLevel)
    .filter((n): n is number => n !== null);

  return {
    connected: true,
    players: scan.players.length,
    scanCapped: scan.scanCapped,
    pushReachable: scan.players.filter((p) => p.pushToken).length,
    highestLevel: highest.length ? Math.max(...highest) : null,
    avgLevelsCompleted: average(scan.players.map((p) => p.levelsCompleted)),
    recentActivity: recent,
    latestActivityAt: recent[0]?.timestamp ?? null,
  };
}
