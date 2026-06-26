"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

export function CityMotion() {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".city-hero");
    if (!root) return;

    const onVisibility = () => {
      root.toggleAttribute("data-paused", document.hidden);
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    if (shouldReduceMotion) {
      root.setAttribute("data-reduced-motion", "true");
      return () => {
        root.removeAttribute("data-reduced-motion");
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--pointer-x", `${event.clientX / innerWidth - 0.5}`);
        root.style.setProperty("--pointer-y", `${event.clientY / innerHeight - 0.5}`);
      });
    };

    addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [shouldReduceMotion]);

  return (
    <motion.div
      className="city-ambient-motion"
      aria-hidden="true"
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
