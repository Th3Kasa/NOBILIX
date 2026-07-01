import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MobileNavigation } from "@/components/nav/mobile-navigation";
import { requirePlayerSession } from "@/lib/player-session";

export const metadata: Metadata = {
  title: "My Account — TrapMan",
  description: "Your TrapMan player account — progression, stats, and settings.",
  robots: { index: false },
};

const accountNavigationItems = [
  { href: "/trapman/account", label: "Dashboard", description: "Progress and purchases" },
  { href: "/trapman/delete-account", label: "Delete account", description: "Permanent removal" },
  { href: "/trapman/privacy-policy", label: "Privacy", description: "Project policy" },
  { href: "/trapman", label: "TrapMan", description: "Project home" },
];

export default async function PlayerAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlayerSession();

  return (
    <div className="player-account-shell">
      <div className="player-account-shell__plate" aria-hidden="true">
        <Image
          src="/assets/generated/trapman/account-shell-plate.webp"
          alt=""
          width={1536}
          height={864}
          sizes="100vw"
        />
      </div>
      <header className="player-account-header">
        <Link href="/trapman" className="player-account-logo-link">
          TrapMan Account
        </Link>
        <nav className="player-account-nav" aria-label="Account navigation">
          {accountNavigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <MobileNavigation items={accountNavigationItems} label="Account navigation" />
      </header>
      <main id="main-content" tabIndex={-1} className="player-account-main">
        {children}
      </main>
    </div>
  );
}
