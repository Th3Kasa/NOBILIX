"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";

export interface RevealProps
  extends Omit<
    HTMLMotionProps<"div">,
    "animate" | "initial" | "transition" | "viewport" | "whileInView"
  > {
  delay?: number;
  distance?: number;
  duration?: number;
}

export function Reveal({
  children,
  delay = 0,
  distance = 24,
  duration = 0.48,
  ...props
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        shouldReduceMotion ? false : { opacity: 0, transform: `translateY(${distance}px)` }
      }
      animate={shouldReduceMotion ? { opacity: 1, transform: "none" } : undefined}
      whileInView={
        shouldReduceMotion ? undefined : { opacity: 1, transform: "translateY(0px)" }
      }
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay, duration, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
