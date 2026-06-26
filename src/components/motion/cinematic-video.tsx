"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
  const [useVideo, setUseVideo] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) setUseVideo(true);
    const handler = (e: MediaQueryListEvent) => setUseVideo(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!useVideo || failed) {
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
