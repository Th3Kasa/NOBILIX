import Link from "next/link";

export function NobilixHeader() {
  return (
    <header className="public-header">
      <Link className="public-wordmark" href="/">NOBILIX</Link>
      <nav aria-label="Primary navigation">
        <Link href="/#projects">Projects</Link>
        <Link href="/legal">Legal</Link>
        <Link href="/console">Console</Link>
      </nav>
    </header>
  );
}
