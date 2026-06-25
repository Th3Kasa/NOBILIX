import type { Metadata } from "next";
import { requirePlayerSession } from "@/lib/player-session";

export const metadata: Metadata = {
  title: "My Account — TrapMan",
  description: "Your TrapMan player account — progression, stats, and settings.",
  robots: { index: false },
};

export default async function PlayerAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth guard — redirects to login if no valid session cookie.
  // Do not remove or bypass with middleware alone.
  await requirePlayerSession();

  return (
    <div className="player-account-shell">
      <header className="player-account-header">
        <a href="/trapman" className="player-account-logo-link">
          TrapMan
        </a>
        <nav className="player-account-nav" aria-label="Account navigation">
          <a href="/trapman/account">Dashboard</a>
          <a href="/trapman/account?action=signout">Sign out</a>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} className="player-account-main">
        {children}
      </main>
    </div>
  );
}
