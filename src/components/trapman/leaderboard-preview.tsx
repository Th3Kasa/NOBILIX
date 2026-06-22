import { listLeaderboard } from "@/lib/leaderboard";

export async function LeaderboardPreview() {
  const { entries, connected } = await listLeaderboard(5, 0);

  if (!connected) {
    return (
      <div className="leaderboard-preview leaderboard-unavailable" role="status">
        <p className="leaderboard-unavailable-title">Leaderboard offline</p>
        <p className="leaderboard-unavailable-msg">
          Check back soon — rankings are temporarily unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="leaderboard-preview">
      <table className="leaderboard-table">
        <caption className="sr-only">Top 5 TrapMan players</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Player</th>
            <th scope="col">Country</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.uid} className="leaderboard-row">
              <td className="leaderboard-rank">{entry.rank}</td>
              <td className="leaderboard-name">{entry.displayName ?? "Anonymous"}</td>
              <td className="leaderboard-country">{entry.country ?? "—"}</td>
              <td className="leaderboard-score">{entry.score.toLocaleString()}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={4} className="leaderboard-empty">No rankings yet — be the first!</td>
            </tr>
          )}
        </tbody>
      </table>
      <a href="/trapman/account" className="leaderboard-cta">See your rank</a>
    </div>
  );
}
