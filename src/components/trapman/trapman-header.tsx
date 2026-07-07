import Image from "next/image";
import Link from "next/link";
import { MobileNavigation } from "@/components/nav/mobile-navigation";

const links = [
  {
    href: "/trapman#the-run",
    label: "Run",
    description: "The endless pixel sprint through Sydney underground",
  },
  {
    href: "/trapman#world",
    label: "World",
    description: "Sydney's underground rebuilt in neon",
  },
  {
    href: "/trapman#shop",
    label: "Shop",
    description: "Remove ads, unlock music, and items",
  },
  {
    href: "/trapman#leaderboard",
    label: "Leaderboard",
    description: "Ranked runs, top players",
  },
  {
    href: "/trapman/account",
    label: "Account",
    description: "Track progression and manage your account",
  },
  {
    href: "/trapman#support",
    label: "Support",
    description: "Help, legal, and data requests",
  },
];

export function TrapManHeader() {
  return (
    <header className="trapman-header">
      <Link href="/trapman" aria-label="TrapMan home" className="trapman-header__brand">
        <Image src="/assets/trapman-logo.png" alt="" width={64} height={64} priority />
        <span className="pixel-type trapman-header__wordmark">TRAPMAN</span>
      </Link>
      <nav aria-label="TrapMan navigation" className="trapman-header__nav">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <MobileNavigation
        items={links}
        label="TrapMan navigation"
        triggerClassName="tm-mobile-nav-trigger"
      />
    </header>
  );
}
