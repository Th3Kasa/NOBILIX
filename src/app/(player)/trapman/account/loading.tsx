export default function PlayerAccountLoading() {
  return (
    <div className="player-account-loading" aria-live="polite" aria-busy="true">
      <div className="player-account-skeleton" />
      <p>Loading your TrapMan account…</p>
    </div>
  );
}
