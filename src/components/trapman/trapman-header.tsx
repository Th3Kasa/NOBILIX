import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/trapman#the-run", label: "Run" },
  { href: "/trapman#world", label: "World" },
  { href: "/trapman#leaderboard", label: "Leaderboard" },
  { href: "/trapman/account", label: "Account" },
  { href: "/trapman#support", label: "Support" },
];

export function TrapManHeader() {
  return (
    <header className="trapman-header">
      <Link href="/trapman" aria-label="TrapMan home" className="trapman-header__brand">
        <Image src="/assets/trapman-logo.png" alt="" width={64} height={64} priority />
        <span className="pixel-type trapman-header__wordmark">TRAPMAN</span>
      </Link>
      <nav aria-label="TrapMan navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
