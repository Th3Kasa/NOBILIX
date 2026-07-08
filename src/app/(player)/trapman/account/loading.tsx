export default function PlayerAccountLoading() {
  return (
    <div className="player-dashboard" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading your TrapMan account…</span>

      {/* Mirrors .player-dashboard-header: kicker + title + identity line. */}
      <div className="player-dashboard-header">
        <div className="player-account-skeleton player-account-skeleton--kicker" />
        <div className="player-account-skeleton player-account-skeleton--title" />
        <div className="player-account-skeleton player-account-skeleton--identity" />
      </div>

      {/* Mirrors .player-dashboard-grid: progression spans full width,
          purchases + actions sit side by side below (same grid areas the
          real panels use, so nothing reflows once data arrives). */}
      <div className="player-dashboard-grid">
        <div className="player-progression-panel" aria-hidden="true">
          <div className="player-account-skeleton player-account-skeleton--heading" />
          <div className="player-account-skeleton player-account-skeleton--line" />
          <div className="player-skeleton-stats">
            <div className="player-account-skeleton player-account-skeleton--stat" />
            <div className="player-account-skeleton player-account-skeleton--stat" />
            <div className="player-account-skeleton player-account-skeleton--stat" />
            <div className="player-account-skeleton player-account-skeleton--stat" />
          </div>
        </div>
        <div className="player-purchase-history" aria-hidden="true">
          <div className="player-account-skeleton player-account-skeleton--heading" />
          <div className="player-account-skeleton player-account-skeleton--row" />
          <div className="player-account-skeleton player-account-skeleton--row" />
        </div>
        <div className="player-account-actions" aria-hidden="true">
          <div className="player-account-skeleton player-account-skeleton--heading" />
          <div className="player-account-skeleton player-account-skeleton--row" />
        </div>
      </div>
    </div>
  );
}
