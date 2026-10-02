import "server-only";
import { getPlayerScan, PLAYER_SCAN_CAP } from "@/lib/trapman/player-scan";
import { getPurchasesData } from "../purchases/data";

/**
 * The Players list, from the shared player snapshot (see player-scan) read
 * through the shared field rules (see player-fields) — the same snapshot and
 * rules as the Overview, Gameplay, Analytics and Purchases tabs.
 *
 * The game never writes `createdAt` or `displayName`, and Firestore silently
 * drops documents that lack an orderBy field, so filtering, sorting and paging
 * happen in memory over the snapshot (capped at PLAYER_SCAN_CAP players).
 */

export interface PlayerRow {
  uid: string;
  username: string | null;
  email: string | null;
  country: string | null;
  isGuest: boolean;
  /** Furthest level reached, current or completed — as on Overview and Gameplay. */
  highestLevel: number | null;
  currentLevel: number | null;
  /** Distinct levels completed. */
  completedLevels: number;
  /**
   * Real sales by this player, counted exactly as the Purchases page counts
   * them (tests, Editor sessions and refunds excluded).
   */
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
      return (a.highestLevel ?? -1) - (b.highestLevel ?? -1);
    case "levelsDone":
      return a.completedLevels - b.completedLevels;
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

/** Players as rows, with real-sale counts from the Purchases accounting. */
async function loadPlayerRows(): Promise<{
  connected: boolean;
  players: PlayerRow[];
  scanCapped: boolean;
  error?: string;
}> {
  const [scan, purchases] = await Promise.all([getPlayerScan(), getPurchasesData()]);
  if (!scan.connected) {
    return { connected: false, players: [], scanCapped: false, error: scan.error };
  }
  const realSales = new Map<string, number>();
  for (const r of purchases.records) {
    if (r.exclusion === null) realSales.set(r.buyerUid, (realSales.get(r.buyerUid) ?? 0) + 1);
  }
  return {
    connected: true,
    scanCapped: scan.scanCapped,
    players: scan.players.map((p) => ({
      uid: p.uid,
      username: p.name,
      email: p.email,
      country: p.country,
      isGuest: p.isGuest,
      highestLevel: p.highestLevel,
      currentLevel: p.currentLevel,
      completedLevels: p.levelsCompleted,
      purchaseCount: realSales.get(p.uid) ?? 0,
      pushReachable: p.pushToken !== null,
    })),
  };
}

export async function listPlayers(
  params: ListPlayersParams = {},
): Promise<ListPlayersResult> {
  const { search, country, guest = "all", limit = 50, offset = 0 } = params;
  const { field: sortField, direction: sortDirection } = parseSort(params.sort);
  const scan = await loadPlayerRows();
  if (!scan.connected) {
    return {
      players: [],
      totalMatching: 0,
      nextOffset: null,
      connected: false,
      scanCapped: false,
      sampleCap: PLAYER_SCAN_CAP,
      sortField,
      sortDirection,
      error: scan.error,
    };
  }
  const scanCapped = scan.scanCapped;
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
    sampleCap: PLAYER_SCAN_CAP,
    sortField,
    sortDirection,
  };
}
