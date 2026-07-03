import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Mirrors the game's PLAY button: pixel type inside a neon-bordered rounded
 * rectangle with a faint grid fill. Used as the primary install/explore CTA.
 */
export function PlayButton({
  href,
  children,
  ...rest
}: { href: string; children: React.ReactNode } & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link href={href} className="tm-play-btn pixel-type" {...rest}>
      <span className="tm-play-btn__grid" aria-hidden="true" />
      <span className="tm-play-btn__label">{children}</span>
    </Link>
  );
}
