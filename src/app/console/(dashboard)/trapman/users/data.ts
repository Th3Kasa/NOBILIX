import "server-only";
import { unstable_cache } from "next/cache";
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

/** Sortable columns, matching the visible table headers. */
export const SORTABLE_FIELDS = [
  "name",
  "country",
  "level",
  "levelsDone",
  "purchases",
] as const;
export type SortField = (typeof SORTABLE_FIELDS)[number];

export interface ListPlayersParams {
  search?: string;
  country?: string;
  guest?: "all" | "guest" | "registered";
  limit?: number;
  offset?: number;
  /** Column to sort by, ascending unless prefixed with "-". Defaults to name. */
  sort?: string;
}

export interface ListPlayersResult {
  players: PlayerRow[];
  totalMatching: number;
  nextOffset: number | null;
  connected: boolean;
  /** True when the raw scan hit MAX_SAMPLE — totalMatching may undercount
   *  the real player base, and the UI should say so honestly. */
  scanCapped: boolean;
  sampleCap: number;
  sortField: SortField;
  sortDirection: "asc" | "desc";
  error?: string;
}

function parseSort(raw: string | undefined): { field: SortField; direction: "asc" | "desc" } {
  const desc = raw?.startsWith("-") ?? false;
  const field = (desc ? raw?.slice(1) : raw) as SortField | undefined;
  return {
    field: field && (SORTABLE_FIELDS as readonly string[]).includes(field) ? field : "name",
    direction: desc ? "desc" : "asc",
  };
}

function compareBy(field: SortField, a: PlayerRow, b: PlayerRow): number {
  switch (field) {
    case "country": {
      if (a.country && b.country) return a.country.localeCompare(b.country);
      if (a.country) return -1;
      if (b.country) return 1;
      return 0;
    }
    case "level":
      return (a.currentLevel ?? -1) - (b.currentLevel ?? -1);
    case "levelsDone":
      return (a.completedLevels ?? -1) - (b.completedLevels ?? -1);
    case "purchases":
      return a.purchaseCount - b.purchaseCount;
    case "name":
    default: {
      if (a.username && b.username) return a.username.localeCompare(b.username);
      if (a.username) return -1;
      if (b.username) return 1;
      return a.uid.localeCompare(b.uid);
    }
  }
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

interface PlayerScan {
  connected: boolean;
  players: PlayerRow[];
  error?: string;
}

async function fetchPlayerScan(): Promise<PlayerScan> {
  try {
    const db = getDb();
    const snap = await db.collection(GAME.users).limit(MAX_SAMPLE).get();

    const players: PlayerRow[] = snap.docs.map((doc) => {
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

    return { connected: true, players };
  } catch (err) {
    return {
      connected: false,
      players: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * 30s shared cache on the RAW scan only — search/filter/paging run
 * per-request below, so a hundred different searches still cost one
 * 1,000-doc scan per refresh window, not one scan each. (unstable_cache is
 * deprecated in favour of "use cache", which needs the app-wide
 * cacheComponents migration — out of scope here.)
 */
const getPlayerScan = unstable_cache(fetchPlayerScan, ["trapman-players-scan"], {
  revalidate: 30,
  tags: ["trapman-console"],
});

export async function listPlayers(
  params: ListPlayersParams = {},
): Promise<ListPlayersResult> {
  const { search, country, guest = "all", limit = 50, offset = 0 } = params;
  const { field: sortField, direction: sortDirection } = parseSort(params.sort);
  const scan = await getPlayerScan();
  if (!scan.connected) {
    return {
      players: [],
      totalMatching: 0,
      nextOffset: null,
      connected: false,
      scanCapped: false,
      sampleCap: MAX_SAMPLE,
      sortField,
      sortDirection,
      error: scan.error,
    };
  }
  const scanCapped = scan.players.length >= MAX_SAMPLE;
  let players = [...scan.players];

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
    const cmp = compareBy(sortField, a, b);
    return sortDirection === "desc" ? -cmp : cmp;
  });

  const totalMatching = players.length;
  // Accumulating window (0..offset+limit), not a fixed [offset, offset+limit)
  // slice — "Load more" appends the next page instead of replacing the rows
  // already on screen.
  const page = players.slice(0, offset + limit);
  const nextOffset = offset + limit < totalMatching ? offset + limit : null;

  return {
    players: page,
    totalMatching,
    nextOffset,
    connected: true,
    scanCapped,
    sampleCap: MAX_SAMPLE,
    sortField,
    sortDirection,
  };
}
