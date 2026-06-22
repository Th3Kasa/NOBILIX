import type { PlayerAccountSnapshot } from "@/types/player-account";

interface ProgressionPanelProps {
  snapshot: PlayerAccountSnapshot;
}

export function ProgressionPanel({ snapshot }: ProgressionPanelProps) {
  const { competitionsWon, progress, analytics } = snapshot;

  return (
    <section className="player-progression-panel" aria-labelledby="progression-heading">
      <h2 id="progression-heading">Your Progression</h2>

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

      {progress && Object.keys(progress).length > 0 && (
        <details className="player-raw-progress">
          <summary>Game progress data</summary>
          <p className="player-progress-note">
            Your saved game data is stored securely and linked to your account.
          </p>
        </details>
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
