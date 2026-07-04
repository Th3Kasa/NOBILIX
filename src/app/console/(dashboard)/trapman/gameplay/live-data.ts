import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";

/**
 * Real gameplay/progression analytics computed from the confirmed live
 * schema (`users.currentLevel` and `users.completedLevels`). Replaces the
 * placeholder that waited on a `player_progress` collection that no longer
 * exists — progression now lives directly on the player document.
 */

const MAX_SAMPLE = 1000;

export interface LevelRow {
  level: number;
  playersAtLevel: number;
  playersCompleted: number;
}

export interface GameplayLiveData {
  connected: boolean;
  sampleSize: number;
  levels: LevelRow[];
  maxLevel: number | null;
  avgCurrentLevel: number | null;
  avgCompleted: number | null;
  playersWithProgress: number;
  error?: string;
}

export async function getGameplayLiveData(): Promise<GameplayLiveData> {
  try {
    const db = getDb();
    const snap = await db.collection(GAME.users).limit(MAX_SAMPLE).get();

    const atLevel = new Map<number, number>();
    const completedAtLevel = new Map<number, number>();
    let levelSum = 0;
    let levelCount = 0;
    let completedSum = 0;
    let completedCount = 0;
    let maxLevel: number | null = null;
    let withProgress = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      let hasProgress = false;

      if (typeof d.currentLevel === "number") {
        atLevel.set(d.currentLevel, (atLevel.get(d.currentLevel) ?? 0) + 1);
        levelSum += d.currentLevel;
        levelCount += 1;
        maxLevel = maxLevel == null ? d.currentLevel : Math.max(maxLevel, d.currentLevel);
        hasProgress = true;
      }

      if (Array.isArray(d.completedLevels)) {
        completedSum += d.completedLevels.length;
        completedCount += 1;
        if (d.completedLevels.length > 0) hasProgress = true;
        for (const lvl of d.completedLevels) {
          if (typeof lvl === "number") {
            completedAtLevel.set(lvl, (completedAtLevel.get(lvl) ?? 0) + 1);
          }
        }
      }

      if (hasProgress) withProgress += 1;
    }

    const allLevels = new Set<number>([
      ...atLevel.keys(),
      ...completedAtLevel.keys(),
    ]);
    const levels: LevelRow[] = [...allLevels]
      .sort((a, b) => a - b)
      .map((level) => ({
        level,
        playersAtLevel: atLevel.get(level) ?? 0,
        playersCompleted: completedAtLevel.get(level) ?? 0,
      }));

    return {
      connected: true,
      sampleSize: snap.size,
      levels,
      maxLevel,
      avgCurrentLevel:
        levelCount > 0 ? Math.round((levelSum / levelCount) * 10) / 10 : null,
      avgCompleted:
        completedCount > 0
          ? Math.round((completedSum / completedCount) * 10) / 10
          : null,
      playersWithProgress: withProgress,
    };
  } catch (err) {
    return {
      connected: false,
      sampleSize: 0,
      levels: [],
      maxLevel: null,
      avgCurrentLevel: null,
      avgCompleted: null,
      playersWithProgress: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
