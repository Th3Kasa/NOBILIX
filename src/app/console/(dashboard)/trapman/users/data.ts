import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";

/**
 * Players listing built on the CONFIRMED live schema.
 *
 * The game writes `username`, `currentLevel`, `completedLevels`, `isGuest`,
 * `fcmToken`, and an embedded `purchases` map — it never writes `createdAt`
 * or `displayName`. The generic lib listing orders by those missing fields,
 * and Firestore silently excludes any document that lacks an orderBy field,
 * which made the Players tab show "No players found" while Overview counted
 * 5. This module reads documents without a server-side orderBy and does its
 * filtering, sorting, and paging in memory (the sample is capped at 1,000).
 */

const MAX_SAMPLE = 1000;

export interface PlayerRow {
  uid: string;
  username: string | null;
  email: string | null;
  country: string | null;
  isGuest: boolean;
  currentLevel: number | null;
  completedLevels: number | null;
  purchaseCount: number;
  pushReachable: boolean;
}

export interface ListPlayersParams {
  search?: string;
  country?: string;
  guest?: "all" | "guest" | "registered";
  limit?: number;
  offset?: number;
}

export interface ListPlayersResult {
  players: PlayerRow[];
  totalMatching: number;
  nextOffset: number | null;
  connected: boolean;
  error?: string;
}

function countParsablePurchases(value: unknown): number {
  if (typeof value !== "object" || value === null) return 0;
  let count = 0;
  for (const record of Object.values(value as Record<string, unknown>)) {
    if (
      record &&
      typeof record === "object" &&
      typeof (record as Record<string, unknown>).productId === "string" &&
      typeof (record as Record<string, unknown>).price === "number"
    ) {
      count += 1;
    }
  }
  return count;
}

export async function listPlayers(
  params: ListPlayersParams = {},
): Promise<ListPlayersResult> {
  const { search, country, guest = "all", limit = 50, offset = 0 } = params;
  try {
    const db = getDb();
    const snap = await db.collection(GAME.users).limit(MAX_SAMPLE).get();

    let players: PlayerRow[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        username:
          typeof d.username === "string" && d.username.trim()
            ? d.username.trim()
            : null,
        email: typeof d.email === "string" ? d.email : null,
        country:
          typeof d.country === "string" && d.country.trim()
            ? d.country.trim().toUpperCase()
            : null,
        isGuest: d.isGuest === true,
        currentLevel: typeof d.currentLevel === "number" ? d.currentLevel : null,
        completedLevels: Array.isArray(d.completedLevels)
          ? d.completedLevels.length
          : null,
        purchaseCount: countParsablePurchases(d.purchases),
        pushReachable: typeof d.fcmToken === "string" && d.fcmToken.length > 0,
      };
    });

    if (search?.trim()) {
      const needle = search.trim().toLowerCase();
      players = needle.includes("@")
        ? players.filter((p) => p.email?.toLowerCase() === needle)
        : players.filter((p) => p.username?.toLowerCase().startsWith(needle));
    }
    if (country?.trim()) {
      const code = country.trim().toUpperCase();
      players = players.filter((p) => p.country === code);
    }
    if (guest === "guest") players = players.filter((p) => p.isGuest);
    if (guest === "registered") players = players.filter((p) => !p.isGuest);

    players.sort((a, b) => {
      if (a.username && b.username) return a.username.localeCompare(b.username);
      if (a.username) return -1;
      if (b.username) return 1;
      return a.uid.localeCompare(b.uid);
    });

    const totalMatching = players.length;
    const page = players.slice(offset, offset + limit);
    const nextOffset = offset + limit < totalMatching ? offset + limit : null;

    return { players: page, totalMatching, nextOffset, connected: true };
  } catch (err) {
    return {
      players: [],
      totalMatching: 0,
      nextOffset: null,
      connected: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
