import "server-only";
import { getPlayerScan } from "@/lib/trapman/player-scan";

/**
 * Player countries for the Analytics tab, from the shared player snapshot
 * (see player-scan) and the shared field rules (see player-fields), so country
 * figures match the Players, Gameplay and Overview tabs.
 *
 * Never fabricates values — an empty or small sample renders as a small,
 * honest distribution rather than being padded or hidden.
 */

export interface CountrySlice {
  country: string;
  count: number;
}

export interface AnalyticsData {
  connected: boolean;
  sampleSize: number;
  scanCapped: boolean;
  /** Top 8 countries, for the chart. */
  countries: CountrySlice[];
  /** How many distinct countries players come from (not capped at 8). */
  countryCount: number;
  error?: string;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const scan = await getPlayerScan();
  if (!scan.connected) {
    return {
      connected: false,
      sampleSize: 0,
      scanCapped: false,
      countries: [],
      countryCount: 0,
      error: scan.error,
    };
  }

  const countryCounts = new Map<string, number>();
  for (const p of scan.players) {
    if (p.country) countryCounts.set(p.country, (countryCounts.get(p.country) ?? 0) + 1);
  }

  return {
    connected: true,
    sampleSize: scan.players.length,
    scanCapped: scan.scanCapped,
    countries: [...countryCounts.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    countryCount: countryCounts.size,
  };
}
