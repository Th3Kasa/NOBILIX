/**
 * Inline SVG neon skyline — the game's home-screen silhouette recreated in
 * code: opera-house shells, a tapering CBD spire, and tower blocks, drawn as
 * glowing magenta/violet neon line-art on black with tiny lit cyan/pink
 * windows. Pure decoration; CSS drives the slow flicker/glow pulse and is
 * disabled under prefers-reduced-motion.
 */
export function NeonSkyline({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 420"
      fill="none"
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="tm-skyline-magenta" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff9df1" />
          <stop offset="100%" stopColor="#f144ff" />
        </linearGradient>
        <linearGradient id="tm-skyline-violet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c98bff" />
          <stop offset="100%" stopColor="#8c27ff" />
        </linearGradient>
      </defs>

      {/* Far tower cluster, left */}
      <g className="tm-skyline__far" stroke="url(#tm-skyline-violet)" strokeWidth="2">
        <path d="M20 420 V300 H62 V420" />
        <path d="M78 420 V240 H126 V420" />
        <path d="M150 420 V330 H182 V420" />
        {/* windows */}
        <g className="tm-skyline__windows" fill="#39e9ff">
          <rect x="30" y="320" width="6" height="6" />
          <rect x="46" y="320" width="6" height="6" />
          <rect x="30" y="345" width="6" height="6" />
          <rect x="88" y="260" width="6" height="6" />
          <rect x="104" y="260" width="6" height="6" />
          <rect x="88" y="285" width="6" height="6" />
          <rect x="104" y="310" width="6" height="6" />
        </g>
      </g>

      {/* CBD spire, centre-right — the tapering Sydney tower */}
      <g className="tm-skyline__spire" stroke="url(#tm-skyline-magenta)" strokeWidth="3" strokeLinejoin="round">
        <path d="M560 420 V210 H586 V150 L573 90 L560 150 V210" />
        <path d="M560 210 H586" />
        <path d="M567 90 V60" />
        <circle cx="573" cy="52" r="6" fill="#fff" stroke="url(#tm-skyline-magenta)" />
      </g>

      {/* Mid tower blocks */}
      <g className="tm-skyline__mid" stroke="url(#tm-skyline-violet)" strokeWidth="2">
        <path d="M430 420 V270 H480 V420" />
        <path d="M496 420 V330 H520 V420" />
        <path d="M620 420 V300 H660 V420" />
        <path d="M676 420 V250 H712 V420" />
        <g className="tm-skyline__windows" fill="#f144ff">
          <rect x="442" y="290" width="6" height="6" />
          <rect x="458" y="290" width="6" height="6" />
          <rect x="442" y="315" width="6" height="6" />
          <rect x="458" y="340" width="6" height="6" />
          <rect x="688" y="270" width="6" height="6" />
          <rect x="688" y="300" width="6" height="6" />
          <rect x="632" y="320" width="6" height="6" />
        </g>
      </g>

      {/* Opera House shells, right */}
      <g className="tm-skyline__opera" stroke="url(#tm-skyline-magenta)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M760 420 C 770 340 800 300 840 300 C 830 280 838 250 862 240 C 880 260 878 285 866 296 C 900 292 928 320 924 360 C 950 350 980 365 980 400 L980 420 Z" />
        <path d="M840 300 C 848 330 848 360 838 388" />
      </g>

      {/* Far right minor towers */}
      <g className="tm-skyline__far" stroke="url(#tm-skyline-violet)" strokeWidth="2">
        <path d="M1010 420 V320 H1050 V420" />
        <path d="M1066 420 V360 H1090 V420" />
        <g className="tm-skyline__windows" fill="#39e9ff">
          <rect x="1022" y="340" width="6" height="6" />
          <rect x="1022" y="365" width="6" height="6" />
        </g>
      </g>
    </svg>
  );
}
