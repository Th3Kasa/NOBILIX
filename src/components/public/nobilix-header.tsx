import Link from "next/link";
import { MobileNavigation } from "@/components/nav/mobile-navigation";

const navigationItems = [
  { href: "/#studio", label: "Studio", description: "Company brand" },
  { href: "/#projects", label: "Projects", description: "Current portfolio" },
  { href: "/legal", label: "Company legal", description: "Policies and notices" },
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
        <MobileNavigation items={navigationItems} />
      </div>
    </header>
  );
}
