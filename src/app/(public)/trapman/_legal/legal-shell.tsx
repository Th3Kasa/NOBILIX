import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

interface LegalPageEntry {
  href: string;
  label: string;
}

const TRAPMAN_LEGAL_PAGES: LegalPageEntry[] = [
  { href: "/trapman/privacy-policy", label: "Privacy Policy" },
  { href: "/trapman/terms-of-use", label: "Terms of Use" },
  { href: "/trapman/data-compliance", label: "Data & Compliance" },
  { href: "/trapman/delete-account", label: "Delete Account" },
];

interface LegalShellProps {
  title: string;
  lastUpdated: string;
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
export function LegalShell({ title, lastUpdated, children }: LegalShellProps) {
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

      {/* Header with official logo */}
      <header className="legal-header">
        <Link href="/trapman" className="legal-logo-link">
          <Image
            src="/assets/trapman-logo.png"
            alt="TrapMan by Nobilix"
            width={120}
            height={40}
            className="legal-logo"
            priority
          />
        </Link>
        <div className="legal-title-block">
          <h1 className="legal-title">{title}</h1>
          <p className="legal-last-updated">
            Last updated: <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
          </p>
        </div>
      </header>

      {/* Legal launch gate notice */}
      <aside className="legal-draft-notice" role="note">
        <p>
          <strong>Draft — Pending Legal Review.</strong> This document is an
          informational draft and is not yet reviewed by qualified legal counsel.
          It should not be relied upon as final legal advice until the Legal
          Launch Gate conditions are met.
        </p>
      </aside>

      <div className="legal-body">
        {/* Sticky table of contents for cross-page navigation */}
        <nav className="legal-toc" aria-label="Legal pages">
          <h2 className="legal-toc-heading">TrapMan Legal</h2>
          <ul>
            {TRAPMAN_LEGAL_PAGES.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="legal-toc-link">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main legal content */}
        <main className="legal-content">
          {children}
        </main>
      </div>

      {/* Footer with support contact */}
      <footer className="legal-footer">
        <p>
          Questions about this policy? Contact player support at{" "}
          <a href="mailto:support@nobilix.com">support@nobilix.com</a>.
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

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
