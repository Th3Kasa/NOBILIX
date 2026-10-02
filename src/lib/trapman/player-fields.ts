/**
 * The one definition of every player field the console shows.
 *
 * The game has written several generations of field names (`level` and
 * `currentLevel`, `fcmToken` and `fcm_token`, `isGuest` and `is_guest`), and
 * each console tab used to pick its own subset — so the same player could have
 * a level on one tab and none on another, or be "reachable" on the Overview but
 * not in Messaging. Every tab now reads a player through `readPlayerFields`.
 *
 * Pure (no imports) so the rules are unit-tested.
 */

export interface PlayerFields {
  /** `username`, else `displayName`, else `name`. */
  name: string | null;
  /** ISO country code, trimmed and upper-cased. */
  country: string | null;
  /** Explicitly marked as a guest. A missing flag means a registered player. */
  isGuest: boolean;
  /** Where the player currently is. The game resets this (e.g. to 0) between runs. */
  currentLevel: number | null;
  /** Distinct finished levels that are level numbers, ascending. */
  completedLevels: number[];
  /**
   * How many distinct levels the player has finished. Counts every distinct
   * entry, numbered or not, so a level stored by name still counts.
   */
  levelsCompleted: number;
  /**
   * The furthest level the player has reached: their current level or the
   * highest level they have completed, whichever is greater. This, not
   * `currentLevel`, is what "highest level reached" means — a player who has
   * finished 21 levels and sits on the menu at level 0 has reached level 21.
   */
  highestLevel: number | null;
  /** Push token, when the player has allowed notifications. */
  pushToken: string | null;
  /** Last time the game synced this player (epoch ms). */
  lastSeenMs: number | null;
}

type Doc = Record<string, unknown> | undefined | null;

const text = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

const finite = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** A level number from a number or numeric string ("12"); otherwise null. */
function levelNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isInteger(v) ? v : null;
  if (typeof v === "string" && /^\s*\d+\s*$/.test(v)) return Number(v);
  return null;
}

/** Epoch ms from a number or a Firestore Timestamp (live or serialised). */
export function timeMs(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const t = v as { toMillis?: () => number; _seconds?: number; seconds?: number } | null;
  if (t && typeof t.toMillis === "function") return t.toMillis();
  if (t && typeof t._seconds === "number") return t._seconds * 1000;
  if (t && typeof t.seconds === "number") return t.seconds * 1000;
  return null;
}

export function readPlayerFields(d: Doc): PlayerFields {
  const data = d ?? {};
  const currentLevel = finite(data.currentLevel) ?? finite(data.level);
  const rawCompleted: unknown[] = Array.isArray(data.completedLevels)
    ? data.completedLevels
    : [];
  // Duplicates are the same level saved twice, not two levels.
  const distinctEntries = new Set(
    rawCompleted
      .filter((v) => typeof v === "number" || typeof v === "string")
      .map((v) => String(v).trim())
      .filter(Boolean),
  );
  const completedLevels = [
    ...new Set(
      rawCompleted.map(levelNumber).filter((n): n is number => n !== null),
    ),
  ].sort((a, b) => a - b);
  const topCompleted = completedLevels.at(-1) ?? null;
  const highestLevel =
    currentLevel === null
      ? topCompleted
      : topCompleted === null
        ? currentLevel
        : Math.max(currentLevel, topCompleted);

  return {
    name: text(data.username) ?? text(data.displayName) ?? text(data.name),
    country: text(data.country)?.toUpperCase() ?? null,
    isGuest: (data.isGuest ?? data.is_guest) === true,
    currentLevel,
    completedLevels,
    levelsCompleted: distinctEntries.size,
    highestLevel,
    pushToken: text(data.fcmToken) ?? text(data.fcm_token),
    lastSeenMs:
      timeMs(data.lastServerSync) ?? timeMs(data.lastSeenAt) ?? timeMs(data.lastActiveAt),
  };
}

/** Average to one decimal place, or null for no values. */
export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
