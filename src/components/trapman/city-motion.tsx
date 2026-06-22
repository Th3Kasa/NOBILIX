"use client";

import { useEffect } from "react";

export function CityMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".city-hero");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--pointer-x", `${event.clientX / innerWidth - 0.5}`);
        root.style.setProperty("--pointer-y", `${event.clientY / innerHeight - 0.5}`);
      });
    };
    const onVisibility = () => root.toggleAttribute("data-paused", document.hidden);
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return null;
}
