/**
 * Player account types for the TrapMan portal.
 * Analytics counters are explicitly nullable — they show "Not available yet"
 * in the UI unless Firestore stores an explicit numeric value.
 */

export interface PlayerPurchase {
  id: string;
  productId: string;
  purchasedAt: number | null;
}

export interface PlayerAnalytics {
  totalPlaytimeMs: number | null;
  adsWatchedCount: number | null;
  adsClickedCount: number | null;
  updatedAt: number | null;
}

export interface PlayerAccountSnapshot {
  uid: string;
  username: string | null;
  email: string | null;
  country: string | null;
  competitionsWon: number | null;
  progress: Record<string, unknown> | null;
  purchases: PlayerPurchase[];
  analytics: PlayerAnalytics;
}
