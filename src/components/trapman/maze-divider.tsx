"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Cyan maze-corridor motif used as a section divider/background texture,
 * echoing the gameplay screenshot's rounded-corner maze walls. The path
 * draws itself (`pathLength` 0→1) the first time it scrolls into view,
 * then the coin dots stagger their opacity in behind it. Previously this
 * depended on a `.reveal.visible` class that nothing in the app ever
 * added, so the whole motif never animated — this drives it directly
 * with motion's `whileInView`, gated on `prefers-reduced-motion`.
 */
const PATH_D =
  "M0 40 H260 Q280 40 280 60 V100 Q280 120 300 120 H520 Q540 120 540 100 V60 Q540 40 560 40 H820 Q840 40 840 60 V100 Q840 120 860 120 H1200";

const COINS = [
  { cx: 380, cy: 120 },
  { cx: 410, cy: 120 },
  { cx: 440, cy: 120 },
  { cx: 470, cy: 120 },
];

const PATH_DURATION = 0.7;
const COIN_STAGGER = 0.08;

export function MazeDivider({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      className={`tm-maze-divider ${className ?? ""}`.trim()}
      viewBox="0 0 1200 160"
      fill="none"
      role="img"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <motion.path
        className="tm-maze-divider__path"
        d={PATH_D}
        stroke="#39e9ff"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="1"
        initial={shouldReduceMotion ? false : { pathLength: 0 }}
        animate={shouldReduceMotion ? { pathLength: 1 } : undefined}
        whileInView={shouldReduceMotion ? undefined : { pathLength: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: PATH_DURATION, ease: [0.22, 1, 0.36, 1] }}
      />
      <g className="tm-maze-divider__coins" fill="#39e9ff">
        {COINS.map((coin, index) => (
          <motion.circle
            key={`${coin.cx}-${coin.cy}`}
            cx={coin.cx}
            cy={coin.cy}
            r={4}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : undefined}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              delay: shouldReduceMotion ? 0 : PATH_DURATION + index * COIN_STAGGER,
            }}
          />
        ))}
      </g>
    </svg>
  );
}
