"use client";

import { useEffect, useRef } from "react";

/**
 * Wires up an IntersectionObserver that adds `.visible` to `.reveal` elements
 * within this component's subtree, triggering the CSS entrance animation.
 * Reduced-motion users see elements immediately (CSS handles this).
 */
export function RevealObserver() {
  const sentinel = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = sentinel.current?.closest(".trapman-site") ?? document;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return <span ref={sentinel} aria-hidden="true" />;
}
