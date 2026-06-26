import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/trapman#the-run", label: "Run" },
  { href: "/trapman#world", label: "World" },
  { href: "/trapman#shop", label: "Shop" },
  { href: "/trapman#leaderboard", label: "Rank" },
  { href: "/trapman/account", label: "Account" },
];

export function TrapManHeader() {
  return (
    <header className="trapman-header">
      <Link href="/trapman" aria-label="TrapMan home" className="trapman-header__brand">
        <Image src="/assets/trapman-logo.png" alt="" width={64} height={64} priority />
        <span>TRAPMAN</span>
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
