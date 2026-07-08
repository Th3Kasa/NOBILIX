import type { PlayerAccountSnapshot } from "@/types/player-account";

interface ProgressionPanelProps {
  snapshot: PlayerAccountSnapshot;
}

// Fields already promoted to their own headline stat above (or to the
// "Last synced" line) — excluded from the raw progress listing below so a
// value never appears twice in the panel.
const SURFACED_PROGRESS_FIELDS = new Set([
  "competitionsWon",
  "totalPlaytimeMs",
  "adsWatchedCount",
  "adsClickedCount",
  "updatedAt",
]);

export function ProgressionPanel({ snapshot }: ProgressionPanelProps) {
  const { competitionsWon, progress, analytics } = snapshot;

  // Only real, present, primitive fields — the lib returns `null` for
  // anything missing, and nested objects/arrays aren't rendered as raw
  // key/value text.
  const additionalProgressEntries: [string, number | string][] = progress
    ? Object.entries(progress).filter(
        (entry): entry is [string, number | string] => {
          const [key, value] = entry;
          return (
            !SURFACED_PROGRESS_FIELDS.has(key) &&
            (typeof value === "number" || typeof value === "string")
          );
        },
      )
    : [];

  return (
    <section className="player-progression-panel" aria-labelledby="progression-heading">
      <h2 id="progression-heading">Your Progression</h2>

      <p className="player-progression-synced">
        {analytics.updatedAt !== null
          ? `Last synced ${formatSyncedAt(analytics.updatedAt)}`
          : "Sync time not available yet"}
      </p>

      <dl className="player-stats-list">
        <div className="player-stat">
          <dt>Competitions Won</dt>
          <dd>
            {competitionsWon !== null
              ? competitionsWon.toLocaleString()
              : "Not available yet"}
          </dd>
        </div>

        <div className="player-stat">
          <dt>Total Playtime</dt>
          <dd>
            {analytics.totalPlaytimeMs !== null
              ? formatPlaytime(analytics.totalPlaytimeMs)
              : "Not available yet"}
          </dd>
        </div>

        <div className="player-stat">
          <dt>Ads Watched</dt>
          <dd>
            {analytics.adsWatchedCount !== null
              ? analytics.adsWatchedCount.toLocaleString()
              : "Not available yet"}
          </dd>
        </div>

        <div className="player-stat">
          <dt>Ads Clicked</dt>
          <dd>
            {analytics.adsClickedCount !== null
              ? analytics.adsClickedCount.toLocaleString()
              : "Not available yet"}
          </dd>
        </div>
      </dl>

      {additionalProgressEntries.length > 0 ? (
        <details className="player-raw-progress">
          <summary>Game progress data</summary>
          <dl className="player-raw-progress-list">
            {additionalProgressEntries.map(([key, value]) => (
              <div key={key} className="player-raw-progress-item">
                <dt>{formatProgressLabel(key)}</dt>
                <dd>{typeof value === "number" ? value.toLocaleString() : value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : (
        <p className="player-progress-note">
          No additional game progress data is on file yet.
        </p>
      )}
    </section>
  );
}

function formatPlaytime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatSyncedAt(ms: number): string {
  return new Date(ms).toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "highestLevel" -> "Highest Level" — formats a raw Firestore field name
 * for display without altering or inventing the underlying data. */
function formatProgressLabel(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
