import type { Metadata } from "next";
import Link from "next/link";
import { PlayerLoginForm } from "@/components/trapman/account/player-login-form";

export const metadata: Metadata = {
  title: "Sign in — TrapMan",
  description: "Sign in to your TrapMan player account to track your progression.",
  robots: { index: false },
};

export default function TrapManLoginPage() {
  return (
    <div className="trapman-login-page">
      <section className="trapman-login-card" aria-labelledby="player-login-title">
        <p className="trapman-kicker">Pixel account portal</p>
        <h1 id="player-login-title">Sign in to TrapMan</h1>
        <p className="trapman-login-subtitle">
          Track your run, see your stats, and manage account requests from a
          secure player surface.
        </p>
        <PlayerLoginForm />
        <Link className="trapman-login-back" href="/trapman">
          Back to TrapMan
        </Link>
      </section>
    </div>
  );
}
