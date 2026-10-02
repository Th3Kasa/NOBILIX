import "server-only";
import { getPlayerScan } from "@/lib/trapman/player-scan";

/**
 * Player distributions for the Analytics tab, from the shared player snapshot
 * (see player-scan) and the shared field rules (see player-fields), so country,
 * level and guest figures match the Players, Gameplay and Overview tabs.
 *
 * Never fabricates values — an empty or small sample renders as a small,
 * honest distribution rather than being padded or hidden.
 */

export interface CountrySlice {
  country: string;
  count: number;
}

export interface LevelBucket {
  bucket: string;
  count: number;
}

export interface AnalyticsData {
  connected: boolean;
  sampleSize: number;
  scanCapped: boolean;
  /** Top 8 countries, for the chart. */
  countries: CountrySlice[];
  /** How many distinct countries players come from (not capped at 8). */
  countryCount: number;
  levelBuckets: LevelBucket[];
  guestShare: { guests: number; registered: number };
  error?: string;
}

function bucketLabel(level: number): string {
  if (level <= 0) return "0";
  const start = Math.floor((level - 1) / 10) * 10 + 1;
  return `${start}-${start + 9}`;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const scan = await getPlayerScan();
  if (!scan.connected) {
    return {
      connected: false,
      sampleSize: 0,
      scanCapped: false,
      countries: [],
      countryCount: 0,
      levelBuckets: [],
      guestShare: { guests: 0, registered: 0 },
      error: scan.error,
    };
  }

  const countryCounts = new Map<string, number>();
  const levelCounts = new Map<string, number>();
  let guests = 0;
  for (const p of scan.players) {
    if (p.country) countryCounts.set(p.country, (countryCounts.get(p.country) ?? 0) + 1);
    // Bucketed by the furthest level reached, the same measure as "Highest
    // level reached" — a player back on the menu at level 0 still counts
    // where they got to.
    if (p.highestLevel !== null) {
      const bucket = bucketLabel(p.highestLevel);
      levelCounts.set(bucket, (levelCounts.get(bucket) ?? 0) + 1);
    }
    if (p.isGuest) guests += 1;
  }

  return {
    connected: true,
    sampleSize: scan.players.length,
    scanCapped: scan.scanCapped,
    countries: [...countryCounts.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    countryCount: countryCounts.size,
    levelBuckets: [...levelCounts.entries()]
      .map(([bucket, count]) => ({ bucket, count }))
      .sort((a, b) => Number(a.bucket.split("-")[0]) - Number(b.bucket.split("-")[0])),
    guestShare: { guests, registered: scan.players.length - guests },
  };
}
