import Link from "next/link";
import { PROJECTS } from "@/config/projects";

export function NobilixFooter() {
  const trapman = PROJECTS.trapman;
  return (
    <footer className="public-footer">
      <div>
        <strong>NOBILIX</strong>
        <p>Nobilix Pty Ltd · New South Wales, Australia</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/legal">Company legal</Link>
        <Link href={trapman.legal.privacy}>TrapMan privacy</Link>
        <Link href={trapman.legal.terms}>TrapMan terms</Link>
        <Link href={trapman.legal.deletion}>Delete account</Link>
      </nav>
    </footer>
  );
}
