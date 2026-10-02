import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";
import { readPlayerFields, type PlayerFields } from "@/lib/trapman/player-fields";
import { parsePurchaseMap, type NormalizedPurchase } from "@/lib/trapman/purchases";

/**
 * The one read of the game's `users` collection that every console tab shares.
 *
 * Overview, Players, Gameplay, Analytics, Purchases and Push each used to scan
 * the collection on their own timer. That cost five scans per refresh against
 * the same Firestore quota the game uses, and it meant tabs described slightly
 * different moments in time. Now they all read this one snapshot, through the
 * same field rules (`readPlayerFields`), so a player counted on one tab is
 * counted the same way on every other.
 */

/** Players read per scan. Tabs say so when a scan hits it. */
export const PLAYER_SCAN_CAP = 1000;

export interface ScannedPlayer extends PlayerFields {
  uid: string;
  email: string | null;
  /** Every readable purchase record on the player's profile, unclassified. */
  purchases: NormalizedPurchase[];
  /** Purchase records too malformed to read. */
  unparsedPurchases: number;
}

export interface PlayerScan {
  connected: boolean;
  players: ScannedPlayer[];
  /** True when the scan hit PLAYER_SCAN_CAP, so totals may undercount. */
  scanCapped: boolean;
  /** When the snapshot was taken (epoch ms). */
  scannedAt: number;
  error?: string;
}

async function scanPlayers(): Promise<PlayerScan> {
  try {
    const snap = await getDb().collection(GAME.users).limit(PLAYER_SCAN_CAP).get();
    const players: ScannedPlayer[] = snap.docs.map((doc) => {
      const data = doc.data();
      const fields = readPlayerFields(data);
      const { purchases, unparsed } = parsePurchaseMap(doc.id, fields.name, data.purchases);
      return {
        uid: doc.id,
        ...fields,
        email: typeof data.email === "string" && data.email.trim() ? data.email.trim() : null,
        purchases,
        unparsedPurchases: unparsed.length,
      };
    });
    return {
      connected: true,
      players,
      scanCapped: snap.size >= PLAYER_SCAN_CAP,
      scannedAt: Date.now(),
    };
  } catch (err) {
    // Thrown so the cache never stores a failed scan (see getPlayerScan).
    throw new ScanFailed(err instanceof Error ? err.message : "Unknown error");
  }
}

class ScanFailed extends Error {}

/**
 * Cached for 2 minutes and shared by every tab and every admin. Marking a test
 * account calls updateTag("trapman-console"), which refreshes it immediately.
 */
const scanPlayersCached = unstable_cache(scanPlayers, ["trapman-player-scan"], {
  revalidate: 120,
  tags: ["trapman-console"],
});

/** Never throws: a failed scan comes back as `connected: false` with the reason. */
export async function getPlayerScan(): Promise<PlayerScan> {
  try {
    return await scanPlayersCached();
  } catch (err) {
    return {
      connected: false,
      players: [],
      scanCapped: false,
      scannedAt: Date.now(),
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
