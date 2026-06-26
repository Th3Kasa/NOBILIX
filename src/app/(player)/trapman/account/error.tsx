"use client";

export default function PlayerAccountError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="player-account-error player-account-error-card" role="alert">
      <p>
        We could not load your TrapMan account. Try again or contact player
        support.
      </p>
      <button type="button" onClick={reset} className="player-account-retry-btn">
        Try again
      </button>
      <a href="mailto:support@nobilix.com" className="player-account-support-link">
        Contact player support
      </a>
    </div>
  );
}
