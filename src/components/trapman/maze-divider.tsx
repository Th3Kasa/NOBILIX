/**
 * Cyan maze-corridor motif used as a section divider/background texture,
 * echoing the gameplay screenshot's rounded-corner maze walls. The stroke
 * uses a dashoffset "line draw" animation driven by the .reveal ancestor
 * gaining `.visible` (see trapman.css); a couple of tiny pixel-coin dots
 * ride along one corridor for texture.
 */
export function MazeDivider({ className }: { className?: string }) {
  return (
    <svg
      className={`tm-maze-divider ${className ?? ""}`.trim()}
      viewBox="0 0 1200 160"
      fill="none"
      role="img"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        className="tm-maze-divider__path"
        d="M0 40 H260 Q280 40 280 60 V100 Q280 120 300 120 H520 Q540 120 540 100 V60 Q540 40 560 40 H820 Q840 40 840 60 V100 Q840 120 860 120 H1200"
        stroke="#39e9ff"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="1"
      />
      <g className="tm-maze-divider__coins" fill="#39e9ff">
        <circle cx="380" cy="120" r="4" />
        <circle cx="410" cy="120" r="4" />
        <circle cx="440" cy="120" r="4" />
        <circle cx="470" cy="120" r="4" />
      </g>
    </svg>
  );
}
