import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { LegalToc, type LegalTocItem } from "@/components/legal/legal-toc";
import { formatLegalDate } from "@/lib/utils";

const TRAPMAN_LEGAL_PAGES: LegalTocItem[] = [
  { href: "/trapman/privacy-policy", label: "Privacy Policy" },
  { href: "/trapman/terms-of-use", label: "Terms of Use" },
  { href: "/trapman/data-compliance", label: "Data & Compliance" },
  { href: "/trapman/delete-account", label: "Delete Account" },
];

const TOC_ITEMS: LegalTocItem[] = [
  { href: "/legal", label: "Company legal" },
  ...TRAPMAN_LEGAL_PAGES,
];

interface LegalShellProps {
  title: string;
  lastUpdated: string;
  /** The current page's own route, e.g. "/trapman/privacy-policy" — drives
   * `aria-current="page"` on the matching table-of-contents link. */
  currentPath: string;
  children: ReactNode;
}

/**
 * Shared legal shell for all TrapMan legal pages.
 * Provides breadcrumb, logo, sticky table of contents, last-updated date,
 * support email, and cross-links between legal pages.
 *
 * Legal Launch Gate: these pages are informational drafts.
 * They must be reviewed by qualified legal counsel before being presented
 * as final legal advice.
 */
export function LegalShell({ title, lastUpdated, currentPath, children }: LegalShellProps) {
  return (
    <div className="legal-shell">
      {/* Breadcrumb */}
      <nav className="legal-breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Nobilix</Link></li>
          <li><Link href="/trapman">TrapMan</Link></li>
          <li aria-current="page">{title}</li>
        </ol>
      </nav>

      {/* Header with official logo, over a calm bespoke plate */}
      <header className="legal-header">
        <div className="legal-header__plate" aria-hidden="true">
          <Image
            src="/assets/generated/trapman/legal-header-plate.webp"
            alt=""
            width={1440}
            height={480}
            sizes="100vw"
            priority
          />
        </div>
        <Link href="/trapman" className="legal-logo-link">
          <Image
            src="/assets/trapman-logo.png"
            alt="TrapMan by Nobilix"
            width={56}
            height={60}
            className="legal-logo"
            priority
          />
        </Link>
        <div className="legal-title-block">
          <h1 className="legal-title">{title}</h1>
          <p className="legal-last-updated">
            Last updated: <time dateTime={lastUpdated}>{formatLegalDate(lastUpdated)}</time>
          </p>
        </div>
      </header>

      <div className="legal-body">
        {/* Sticky table of contents for cross-page navigation */}
        <nav className="legal-toc legal-contents-nav" aria-label="Legal pages">
          <h2 className="legal-toc-heading">TrapMan Legal</h2>
          <LegalToc items={TOC_ITEMS} currentPath={currentPath} linkClassName="legal-toc-link" />
        </nav>

        {/* Main legal content */}
        <article className="legal-content">
          {children}
        </article>
      </div>

      {/* Footer with support contact */}
      <footer className="legal-footer">
        <p>
          Questions about this policy? Contact player support at{" "}
          <a href="mailto:help.nobilix@outlook.com">help.nobilix@outlook.com</a>.
        </p>
        <nav aria-label="Other legal documents">
          {TRAPMAN_LEGAL_PAGES.map(({ href, label }) => (
            <Link key={href} href={href} className="legal-cross-link">
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
