import "server-only";
import { getPlayerScan } from "@/lib/trapman/player-scan";
import { average } from "@/lib/trapman/player-fields";

/**
 * Gameplay and progression figures, from the shared player snapshot (see
 * player-scan) and the shared field rules (see player-fields) — the same
 * definitions the Overview and Players tabs use, so "highest level reached"
 * and "levels completed" read identically everywhere.
 */

export interface LevelRow {
  level: number;
  /** Players whose current level is this one. */
  playersAtLevel: number;
  /** Players who have completed this level. */
  playersCompleted: number;
}

export interface GameplayLiveData {
  connected: boolean;
  sampleSize: number;
  scanCapped: boolean;
  levels: LevelRow[];
  /** Furthest level any player has reached (current or completed). */
  maxLevel: number | null;
  avgCurrentLevel: number | null;
  /** Average distinct levels completed per player. */
  avgCompleted: number | null;
  playersWithProgress: number;
  error?: string;
}

export async function getGameplayLiveData(): Promise<GameplayLiveData> {
  const scan = await getPlayerScan();
  if (!scan.connected) {
    return {
      connected: false,
      sampleSize: 0,
      scanCapped: false,
      levels: [],
      maxLevel: null,
      avgCurrentLevel: null,
      avgCompleted: null,
      playersWithProgress: 0,
      error: scan.error,
    };
  }

  const atLevel = new Map<number, number>();
  const completedAtLevel = new Map<number, number>();
  for (const p of scan.players) {
    if (p.currentLevel !== null) {
      atLevel.set(p.currentLevel, (atLevel.get(p.currentLevel) ?? 0) + 1);
    }
    for (const lvl of p.completedLevels) {
      completedAtLevel.set(lvl, (completedAtLevel.get(lvl) ?? 0) + 1);
    }
  }

  const levels: LevelRow[] = [...new Set([...atLevel.keys(), ...completedAtLevel.keys()])]
    .sort((a, b) => a - b)
    .map((level) => ({
      level,
      playersAtLevel: atLevel.get(level) ?? 0,
      playersCompleted: completedAtLevel.get(level) ?? 0,
    }));

  const highest = scan.players
    .map((p) => p.highestLevel)
    .filter((n): n is number => n !== null);

  return {
    connected: true,
    sampleSize: scan.players.length,
    scanCapped: scan.scanCapped,
    levels,
    maxLevel: highest.length ? Math.max(...highest) : null,
    avgCurrentLevel: average(
      scan.players.map((p) => p.currentLevel).filter((n): n is number => n !== null),
    ),
    avgCompleted: average(scan.players.map((p) => p.levelsCompleted)),
    playersWithProgress: scan.players.filter(
      (p) => (p.currentLevel ?? 0) > 0 || p.levelsCompleted > 0,
    ).length,
  };
}
