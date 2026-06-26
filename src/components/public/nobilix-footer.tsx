import Link from "next/link";
import { PROJECTS } from "@/config/projects";

export function NobilixFooter() {
  const trapman = PROJECTS.trapman;
  return (
    <footer className="public-footer">
      <div className="public-footer__brand">
        <strong>Nobilix</strong>
        <p>Nobilix Pty Ltd · New South Wales, Australia</p>
      </div>
      <nav aria-label="Company links">
        <Link href="/#studio">Studio</Link>
        <Link href="/legal">Company legal</Link>
        <Link href="/console">Console</Link>
      </nav>
      <nav aria-label="Project links">
        <Link href={trapman.publicPath}>TrapMan</Link>
        <Link href={trapman.legal.privacy}>TrapMan privacy</Link>
        <Link href={trapman.legal.terms}>TrapMan terms</Link>
        <Link href={trapman.legal.deletion}>Delete account</Link>
      </nav>
    </footer>
  );
}
