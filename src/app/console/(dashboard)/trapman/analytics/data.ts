import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";

/**
 * Analytics data-access for the TrapMan console.
 *
 * Reads directly from the confirmed `users` collection (country, currentLevel,
 * completedLevels, isGuest fields are confirmed present — see Phase 0 discovery).
 * There is no dedicated `player_progress` or `purchases` data yet, so this module
 * intentionally limits itself to distributions derivable from `users` documents.
 *
 * Never fabricates values — an empty/small sample renders as a small, honest
 * distribution rather than being padded or hidden.
 */

const MAX_SAMPLE = 1000;

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
  countries: CountrySlice[];
  levelBuckets: LevelBucket[];
  guestShare: { guests: number; registered: number };
  error?: string;
}

function bucketLabel(level: number): string {
  if (level <= 0) return "0";
  const start = Math.floor((level - 1) / 10) * 10 + 1;
  const end = start + 9;
  return `${start}-${end}`;
}

async function fetchAnalyticsData(): Promise<AnalyticsData> {
  try {
    const db = getDb();
    const snap = await db.collection(GAME.users).limit(MAX_SAMPLE).get();

    const countryCounts = new Map<string, number>();
    const levelCounts = new Map<string, number>();
    let guests = 0;
    let registered = 0;

    for (const doc of snap.docs) {
      const data = doc.data();

      const country =
        typeof data.country === "string" && data.country.trim()
          ? data.country.trim().toUpperCase()
          : null;
      if (country) {
        countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
      }

      const level =
        typeof data.currentLevel === "number"
          ? data.currentLevel
          : typeof data.level === "number"
            ? data.level
            : null;
      if (level != null) {
        const bucket = bucketLabel(level);
        levelCounts.set(bucket, (levelCounts.get(bucket) ?? 0) + 1);
      }

      if (data.isGuest === true) guests += 1;
      else registered += 1;
    }

    const countries = Array.from(countryCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const levelBuckets = Array.from(levelCounts.entries())
      .map(([bucket, count]) => ({ bucket, count }))
      .sort((a, b) => Number(a.bucket.split("-")[0]) - Number(b.bucket.split("-")[0]));

    return {
      connected: true,
      sampleSize: snap.size,
      countries,
      levelBuckets,
      guestShare: { guests, registered },
    };
  } catch (err) {
    return {
      connected: false,
      sampleSize: 0,
      countries: [],
      levelBuckets: [],
      guestShare: { guests: 0, registered: 0 },
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * 30s shared cache: one 1,000-doc scan serves every admin for the whole
 * auto-refresh window instead of a scan per request. (unstable_cache is
 * deprecated in favour of "use cache", which needs the app-wide
 * cacheComponents migration — out of scope here.)
 */
export const getAnalyticsData = unstable_cache(
  fetchAnalyticsData,
  ["trapman-analytics"],
  { revalidate: 30, tags: ["trapman-console"] },
);
