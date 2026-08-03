import Link from "next/link";
import { PROJECTS } from "@/config/projects";

export function NobilixFooter() {
  const trapman = PROJECTS.trapman;
  const year = new Date().getFullYear();
  return (
    <footer className="public-footer">
      <div className="public-footer__brand">
        <strong>Nobilix</strong>
        <p>Nobilix Pty Ltd · New South Wales, Australia</p>
        <p className="public-footer__meta">
          <span className="public-footer__dot" aria-hidden="true" />
          Studio status: operational · &copy; {year}
        </p>
      </div>
      <nav aria-label="Company links">
        <p className="public-footer__heading">Company</p>
        <Link href="/#studio">Studio</Link>
        <Link href="/legal">Company legal</Link>
        <Link href="/console">Console</Link>
      </nav>
      <nav aria-label="Project links">
        <p className="public-footer__heading">TrapMan</p>
        <Link href={trapman.legal.privacy}>Privacy</Link>
        <Link href={trapman.legal.terms}>Terms</Link>
        <Link href={trapman.legal.deletion}>Delete account</Link>
      </nav>
    </footer>
  );
}
