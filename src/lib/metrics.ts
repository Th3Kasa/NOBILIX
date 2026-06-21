import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";

export interface OverviewMetrics {
  totalUsers: number | null;
  guestUsers: number | null;
  registeredUsers: number | null;
  newUsers7d: number | null;
  /** True when the live DB could be reached. */
  connected: boolean;
  error?: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * High-level counts for the dashboard. Uses Firestore count() aggregations so it
 * stays cheap even on large collections. Resilient: if the DB is unreachable
 * (e.g. credentials not yet configured) it returns nulls instead of throwing.
 */
export async function getOverviewMetrics(): Promise<OverviewMetrics> {
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

    const totalUsers = total.data().count;
    const guestUsers = guests.data().count;

    return {
      totalUsers,
      guestUsers,
      registeredUsers: totalUsers - guestUsers,
      newUsers7d: newUsers.data().count,
      connected: true,
    };
  } catch (err) {
    return {
      totalUsers: null,
      guestUsers: null,
      registeredUsers: null,
      newUsers7d: null,
      connected: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
