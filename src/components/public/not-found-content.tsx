import Link from "next/link";

export function NotFoundContent() {
  return (
    <section className="public-not-found grid-mesh-floor">
      <p className="public-not-found__code pixel-type" aria-hidden="true">404</p>
      <p className="eyebrow">
        <span className="eyebrow__dot" aria-hidden="true" />
        Page not found
      </p>
      <h1>This route is not in the Nobilix map.</h1>
      <p>
        The page may have moved, or the project path may be different from the
        company path. Choose a safe route below.
      </p>
      <div className="public-not-found__actions">
        <Link className="magnetic-hover" href="/">Return to Nobilix</Link>
        <Link className="magnetic-hover" href="/legal">TrapMan policies</Link>
        <Link className="magnetic-hover" href="/#contact">Contact Nobilix</Link>
      </div>
    </section>
  );
}
