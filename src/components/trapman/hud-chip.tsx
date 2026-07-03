/**
 * Recreates the in-game HUD bar's angled, neon-bordered stat readout as a
 * reusable decorative chip — used to frame section stats/facts the way the
 * gameplay screenshot frames HIGH SCORE / LEVEL / SCORE.
 */
export function HudChip({
  label,
  value,
  accent = "cyan",
}: {
  label: string;
  value: string;
  accent?: "cyan" | "magenta" | "yellow" | "violet";
}) {
  return (
    <div className="tm-hud-chip" data-accent={accent}>
      <span className="tm-hud-chip__label">{label}</span>
      <span className="tm-hud-chip__value pixel-type">{value}</span>
    </div>
  );
}

/** A single pixel-heart, matching the game's 3-heart lives readout. */
export function PixelHeart({ filled = true }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 12 10" className="tm-pixel-heart" data-filled={filled} aria-hidden="true">
      <path
        d="M1 2h2V1h2v1h2V1h2v1h2v3h-1v1h-1v1H8v1H7v1H5V9H4V8H3V7H2V6H1z"
        fill="currentColor"
      />
    </svg>
  );
}
