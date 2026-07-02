"use client";

/**
 * Small client-only logo image for {@link ProjectTile}.
 *
 * Isolated into its own client component because it needs an `onError`
 * handler to gracefully hide a broken logo. Event handlers cannot be passed
 * to elements rendered inside a Server Component, so this must not be inlined
 * back into the (server) ProjectTile.
 */
export function ProjectTileLogo({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={28}
      height={28}
      className="size-7 object-contain"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
