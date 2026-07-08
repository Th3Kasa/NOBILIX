import Image from "next/image";
import { listLeaderboard } from "@/lib/leaderboard";

const MEDALS = ["🥇", "🥈", "🥉"] as const;

export async function LeaderboardPreview() {
  const { entries, connected } = await listLeaderboard(5, 0);

  return (
    <div className="leaderboard-stage">
      <div className="leaderboard-stage__plate" aria-hidden="true">
        <Image
          src="/assets/generated/trapman/leaderboard-plate.webp"
          alt=""
          width={1536}
          height={864}
          sizes="(max-width: 900px) 100vw, 40vw"
        />
      </div>

      {!connected ? (
        <div className="leaderboard-preview leaderboard-unavailable" role="status">
          <p className="leaderboard-unavailable-title">Leaderboard offline</p>
          <p className="leaderboard-unavailable-msg">
            Check back soon — rankings are temporarily unavailable.
          </p>
        </div>
      ) : (
        <div className="leaderboard-preview tm-leaderboard-board">
          <div className="tm-leaderboard-board__frame">
            <table className="leaderboard-table">
              <caption className="sr-only">Top 5 TrapMan players</caption>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Username</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const rank = entry.rank ?? index + 1;
                  return (
                  <tr key={entry.uid} className="leaderboard-row" data-top={rank <= 3 || undefined}>
                    <td className="leaderboard-rank">
                      {rank <= 3 ? (
                        <>
                          <span className="tm-leaderboard-medal" aria-hidden="true">{MEDALS[rank - 1]}</span>
                          <span className="sr-only">{`Rank ${rank}`}</span>
                        </>
                      ) : (
                        <span className="pixel-type">{rank}</span>
                      )}
                    </td>
                    <td className="leaderboard-name">
                      {entry.country && (
                        <span className="tm-leaderboard-flag" aria-hidden="true">
                          {countryToFlag(entry.country)}
                        </span>
                      )}
                      {entry.displayName ?? "Anonymous"}
                    </td>
                    <td className="leaderboard-score pixel-type">{entry.score.toLocaleString()}</td>
                  </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={3} className="leaderboard-empty">No rankings yet — be the first!</td>
                  </tr>
                )}
              </tbody>
            </table>
            <span className="tm-leaderboard-board__corner tm-leaderboard-board__corner--tl" aria-hidden="true" />
            <span className="tm-leaderboard-board__corner tm-leaderboard-board__corner--br" aria-hidden="true" />
          </div>
          <a href="/trapman/account" className="leaderboard-cta">See your rank</a>
        </div>
      )}
    </div>
  );
}

/** Best-effort ISO/country-name → flag emoji; falls back to a globe glyph. */
function countryToFlag(country: string): string {
  const code = country.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) {
    const base = 127397;
    return String.fromCodePoint(...[...code].map((c) => c.charCodeAt(0) + base));
  }
  return "🌐";
}
