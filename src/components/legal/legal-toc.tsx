import Link from "next/link";

export interface LegalTocItem {
  href: string;
  label: string;
}

interface LegalTocProps {
  items: readonly LegalTocItem[];
  currentPath: string;
  linkClassName: string;
}

/**
 * Shared table-of-contents list for both legal shells (TrapMan's
 * `legal-shell.tsx` and Nobilix's `nobilix-legal-shell.tsx`). Only the
 * list-rendering + active-link logic is shared — each shell keeps its own
 * distinct wrapper markup/classNames (intentional brand split, see
 * DESIGN.md), passing its own `linkClassName` so the link keeps that
 * shell's visual identity.
 */
export function LegalToc({ items, currentPath, linkClassName }: LegalTocProps) {
  return (
    <ul>
      {items.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={href}
            className={linkClassName}
            aria-current={href === currentPath ? "page" : undefined}
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
