import Link from "next/link";
import { MobileNavigation } from "@/components/nav/mobile-navigation";

const navigationItems = [
  { href: "/#studio", label: "Studio", description: "Company brand" },
  { href: "/legal", label: "Company legal", description: "Policies and notices" },
];

// The mobile sheet also carries the Console entry the desktop CTA renders
// separately (styled as `.header-cta`, not a plain nav link) — so mobile
// visitors see it too without duplicating it into the desktop nav loop.
const mobileNavigationItems = [
  ...navigationItems,
  { href: "/console", label: "Console", description: "Admin sign-in" },
];

export function NobilixHeader() {
  return (
    <header className="public-header">
      <Link className="public-wordmark" href="/" aria-label="Nobilix home">
        <span className="public-wordmark__mark pixel-type" aria-hidden="true">
          N
        </span>
        <span className="public-wordmark__text">
          <span>Nobilix</span>
          <small>Studio</small>
        </span>
      </Link>
      <nav className="public-header__nav" aria-label="Primary navigation">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="public-header__right">
        <Link href="/console" className="header-cta">
          Console
        </Link>
        <MobileNavigation items={mobileNavigationItems} />
      </div>
    </header>
  );
}
