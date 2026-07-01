import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

const NOBILIX_LEGAL_PAGES = [
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/terms-of-use", label: "Terms of Use" },
] as const;

interface NobilixLegalShellProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function NobilixLegalShell({
  title,
  lastUpdated,
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

      <div className="nobilix-legal-art" aria-hidden="true">
        <Image
          src="/assets/generated/nobilix/legal-header-plate.webp"
          alt=""
          width={1440}
          height={480}
          sizes="(max-width: 900px) 100vw, 82rem"
          priority
        />
      </div>

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
            Last updated:{" "}
            <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
          </p>
        </div>
      </header>

      <aside className="nobilix-legal-draft-notice" role="note">
        <p>
          <strong>Draft — Pending Legal Review.</strong> This document is an
          informational draft and has not yet been reviewed by qualified legal
          counsel. Do not rely on it as final legal advice until qualified review
          is complete.
        </p>
      </aside>

      <div className="nobilix-legal-body">
        <nav className="nobilix-legal-toc" aria-label="Nobilix legal documents">
          <h2 className="nobilix-legal-toc-heading">Nobilix Legal</h2>
          <ul>
            <li>
              <Link href="/legal" className="nobilix-legal-toc-link">
                Legal directory
              </Link>
            </li>
            {NOBILIX_LEGAL_PAGES.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="nobilix-legal-toc-link">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nobilix-legal-toc-divider" />
          <h2 className="nobilix-legal-toc-heading">TrapMan Legal</h2>
          <ul>
            <li>
              <Link href="/trapman/privacy-policy" className="nobilix-legal-toc-link">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/trapman/terms-of-use" className="nobilix-legal-toc-link">
                Terms of Use
              </Link>
            </li>
            <li>
              <Link href="/trapman/data-compliance" className="nobilix-legal-toc-link">
                Data &amp; Compliance
              </Link>
            </li>
          </ul>
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

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
