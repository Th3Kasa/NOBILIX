import Link from "next/link";

export default function PublicNotFound() {
  return (
    <section className="public-not-found">
      <p className="eyebrow">Page not found</p>
      <h1>This route is not in the Nobilix map.</h1>
      <p>
        The page may have moved, or the project path may be different from the
        company path. Choose a safe route below.
      </p>
      <div className="public-not-found__actions">
        <Link href="/">Return to Nobilix</Link>
        <Link href="/trapman">View TrapMan</Link>
        <Link href="/console">Open console</Link>
        <Link href="/#contact">Contact Nobilix</Link>
      </div>
    </section>
  );
}
