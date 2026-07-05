"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Server snapshot: treat as reduced so the poster renders until hydration.
const getServerReducedMotion = () => true;

interface CinematicVideoProps {
  /** Path to the generated .mp4 file */
  src: string;
  /** Fallback WebP shown before mount, during reduced motion, and on video error */
  poster: string;
  posterWidth: number;
  posterHeight: number;
  /** Empty string for decorative; provide text for meaningful imagery */
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Plays a looping muted video when the browser supports it and the user
 * hasn't requested reduced motion. Falls back to the WebP poster otherwise.
 *
 * Safe for server rendering: the `<Image>` poster is always rendered on the
 * server and during hydration. The `<video>` replaces it client-side after
 * the first paint via useEffect.
 */
export function CinematicVideo({
  src,
  poster,
  posterWidth,
  posterHeight,
  alt = "",
  className,
  sizes,
  priority,
}: CinematicVideoProps) {
  const [failed, setFailed] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  if (prefersReducedMotion || failed) {
    return (
      <Image
        src={poster}
        alt={alt}
        width={posterWidth}
        height={posterHeight}
        className={className}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  return (
    <video
      className={cn("object-cover", className)}
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      onError={() => setFailed(true)}
      aria-hidden={alt === "" ? true : undefined}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
