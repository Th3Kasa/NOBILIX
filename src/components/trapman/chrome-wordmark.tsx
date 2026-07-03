/**
 * "TRAP-MAN" hero wordmark: Press Start 2P pixel type with a pink → white →
 * cyan vertical chrome gradient (background-clip: text), a violet extrusion
 * shadow, and a few star sparkles. Renders as an <h1> or <p> depending on
 * `as`, so it can be reused as a smaller section kicker-style lockup if
 * needed while staying the single hero headline semantically once per page.
 */
export function ChromeWordmark({
  as: Tag = "h1",
  className,
  id,
}: {
  as?: "h1" | "div";
  className?: string;
  id?: string;
}) {
  return (
    <Tag id={id} className={`tm-chrome-wordmark pixel-type ${className ?? ""}`.trim()}>
      <span className="tm-chrome-wordmark__sparkle tm-chrome-wordmark__sparkle--a" aria-hidden="true">✦</span>
      <span className="tm-chrome-wordmark__text" data-text="TRAP-MAN">TRAP-MAN</span>
      <span className="tm-chrome-wordmark__sparkle tm-chrome-wordmark__sparkle--b" aria-hidden="true">✦</span>
      <span className="tm-chrome-wordmark__sparkle tm-chrome-wordmark__sparkle--c" aria-hidden="true">✧</span>
    </Tag>
  );
}
