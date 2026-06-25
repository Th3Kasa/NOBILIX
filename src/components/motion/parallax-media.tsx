"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";

export interface ParallaxMediaProps
  extends Omit<HTMLMotionProps<"div">, "ref" | "style"> {
  amount?: number;
  style?: HTMLMotionProps<"div">["style"];
}

export function ParallaxMedia({
  amount = 36,
  children,
  style,
  ...props
}: ParallaxMediaProps) {
  const targetRef = React.useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    [-amount, amount],
  );

  return (
    <motion.div
      ref={targetRef}
      style={{ ...style, y: shouldReduceMotion ? 0 : parallaxY }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
