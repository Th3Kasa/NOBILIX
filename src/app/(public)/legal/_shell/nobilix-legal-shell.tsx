import type { ReactNode } from "react";
import Link from "next/link";
import { LegalToc, type LegalTocItem } from "@/components/legal/legal-toc";
import { formatLegalDate } from "@/lib/utils";

const NOBILIX_LEGAL_PAGES: LegalTocItem[] = [
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/terms-of-use", label: "Terms of Use" },
];

const NOBILIX_TOC_ITEMS: LegalTocItem[] = [
  { href: "/legal", label: "Legal directory" },
  ...NOBILIX_LEGAL_PAGES,
];

const TRAPMAN_TOC_ITEMS: LegalTocItem[] = [
  { href: "/trapman/privacy-policy", label: "Privacy Policy" },
  { href: "/trapman/terms-of-use", label: "Terms of Use" },
  { href: "/trapman/data-compliance", label: "Data & Compliance" },
];

interface NobilixLegalShellProps {
  title: string;
  lastUpdated: string;
  /** The current page's own route, e.g. "/legal/privacy-policy" — drives
   * `aria-current="page"` on the matching table-of-contents link. */
  currentPath: string;
  children: ReactNode;
}

export function NobilixLegalShell({
  title,
  lastUpdated,
  currentPath,
  children,
}: NobilixLegalShellProps) {
  return (
    <div className="nobilix-legal-shell">
      <nav className="nobilix-legal-breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Nobilix</Link>
          </li>
          <li>
            <Link href="/legal">Legal</Link>
          </li>
          <li aria-current="page">{title}</li>
        </ol>
      </nav>

      <header className="nobilix-legal-header">
        <div className="nobilix-legal-entity">
          <span className="nobilix-legal-company">Nobilix Pty Ltd</span>
          <span className="nobilix-legal-jurisdiction">
            New South Wales, Australia
          </span>
        </div>
        <div className="nobilix-legal-title-block">
          <h1 className="nobilix-legal-title">{title}</h1>
          <p className="nobilix-legal-updated">
            <span className="nobilix-legal-updated__mono">
              Last updated <time dateTime={lastUpdated}>{formatLegalDate(lastUpdated)}</time>
            </span>
          </p>
        </div>
      </header>

      <div className="nobilix-legal-body">
        <nav className="nobilix-legal-toc" aria-label="Nobilix legal documents">
          <h2 className="nobilix-legal-toc-heading">Nobilix Legal</h2>
          <LegalToc
            items={NOBILIX_TOC_ITEMS}
            currentPath={currentPath}
            linkClassName="nobilix-legal-toc-link"
          />
          <div className="nobilix-legal-toc-divider" />
          <h2 className="nobilix-legal-toc-heading">TrapMan Legal</h2>
          <LegalToc
            items={TRAPMAN_TOC_ITEMS}
            currentPath={currentPath}
            linkClassName="nobilix-legal-toc-link"
          />
        </nav>

        <article className="nobilix-legal-content">{children}</article>
      </div>

      <footer className="nobilix-legal-footer">
        <p>
          Legal enquiries:{" "}
          <a href="mailto:help.nobilix@outlook.com">help.nobilix@outlook.com</a>
        </p>
        <nav aria-label="Other Nobilix legal documents">
          {NOBILIX_LEGAL_PAGES.map(({ href, label }) => (
            <Link key={href} href={href} className="nobilix-legal-cross-link">
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
