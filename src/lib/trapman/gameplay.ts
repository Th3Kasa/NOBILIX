import "server-only";

export interface GameplayRow {
  level: number;
  playerCount: number;
}

export interface GameplayData {
  connected: boolean;
  rows: GameplayRow[];
  unavailableReason: string | null;
}

/**
 * Returns level distribution from the player_progress collection if the
 * `level` field exists. Returns `unavailableReason` if the schema is not
 * yet confirmed.
 *
 * Never throws raw errors into pages.
 */
export async function getGameplayData(): Promise<GameplayData> {
  // The player_progress schema has not been confirmed in production.
  // Return unavailable state until field names are verified.
  //
  // When the schema is confirmed:
  // 1. Query the player_progress collection grouped by `level`.
  // 2. Return rows with { level, playerCount }.
  // 3. Set unavailableReason to null.
  return {
    connected: false,
    rows: [],
    unavailableReason:
      "Gameplay analytics are waiting for the player_progress schema.",
  };
}
