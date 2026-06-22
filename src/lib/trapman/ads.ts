import "server-only";

export interface AdsRow {
  hour: string;
  adsClosed: number;
  adsClicked: number;
}

export interface AdsData {
  connected: boolean;
  rows: AdsRow[];
  unavailableReason: string | null;
}

/**
 * Returns ad_closed and ad_clicked aggregates if persisted counters or
 * export-backed metrics exist. Returns `unavailableReason` until confirmed.
 *
 * Never throws raw errors into pages.
 */
export async function getAdsData(): Promise<AdsData> {
  // ad_closed and ad_clicked counters are not yet persisted in Firestore.
  // Return unavailable state until the collection/counter schema is verified.
  //
  // When the schema is confirmed:
  // 1. Query the aggregated ad metrics (hourly counters or export-backed).
  // 2. Return rows with { hour, adsClosed, adsClicked }.
  // 3. Set unavailableReason to null.
  return {
    connected: false,
    rows: [],
    unavailableReason:
      "Ad analytics require persisted ad_closed and ad_clicked aggregates.",
  };
}
