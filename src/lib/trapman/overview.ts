import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";

export interface TrapManOverview {
  connected: boolean;
  totalPlayers: number | null;
  registeredPlayers: number | null;
  guestPlayers: number | null;
  newPlayers7d: number | null;
  /** null = collection/field not yet confirmed in production schema */
  purchases24h: number | null;
  /** null = purchases schema not yet confirmed */
  revenue24h: number | null;
  /** null = ad_closed counter not yet confirmed */
  adsClosed24h: number | null;
  /** null = ad_clicked counter not yet confirmed */
  adsClicked24h: number | null;
  /** Human-readable labels for each metric that could not be fetched */
  unavailable: string[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Fetches verified live metrics for the TrapMan mission-control overview.
 *
 * Only metrics confirmed against the real Firestore schema are returned as
 * numbers. Unconfirmed or unavailable metrics are returned as `null` and
 * listed in `unavailable`.
 *
 * Never fabricates values.
 */
export async function getTrapManOverview(): Promise<TrapManOverview> {
  const unavailable: string[] = [];

  try {
    const db = getDb();
    const users = db.collection(GAME.users);

    const [total, guests, newUsers] = await Promise.all([
      users.count().get(),
      users.where("isGuest", "==", true).count().get(),
      users
        .where("createdAt", ">=", Date.now() - SEVEN_DAYS_MS)
        .count()
        .get(),
    ]);

    const totalPlayers = total.data().count;
    const guestPlayers = guests.data().count;

    // Purchases and revenue: collection field names and timestamps not yet
    // confirmed — return null until schema is verified.
    unavailable.push("Purchases (24 h) — purchases collection schema pending");
    unavailable.push("Revenue (24 h) — purchases collection schema pending");

    // Ad metrics: ad_closed / ad_clicked aggregates not yet persisted.
    unavailable.push("Ads closed (24 h) — ad_closed counter not yet available");
    unavailable.push("Ads clicked (24 h) — ad_clicked counter not yet available");

    return {
      connected: true,
      totalPlayers,
      registeredPlayers: totalPlayers - guestPlayers,
      guestPlayers,
      newPlayers7d: newUsers.data().count,
      purchases24h: null,
      revenue24h: null,
      adsClosed24h: null,
      adsClicked24h: null,
      unavailable,
    };
  } catch (err) {
    unavailable.push("All metrics — Firebase connection unavailable");
    return {
      connected: false,
      totalPlayers: null,
      registeredPlayers: null,
      guestPlayers: null,
      newPlayers7d: null,
      purchases24h: null,
      revenue24h: null,
      adsClosed24h: null,
      adsClicked24h: null,
      unavailable,
      ...(err instanceof Error ? { error: err.message } : {}),
    };
  }
}
