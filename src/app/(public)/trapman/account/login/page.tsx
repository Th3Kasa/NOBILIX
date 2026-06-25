import type { Metadata } from "next";
import { PlayerLoginForm } from "@/components/trapman/account/player-login-form";

export const metadata: Metadata = {
  title: "Sign in — TrapMan",
  description: "Sign in to your TrapMan player account to track your progression.",
  robots: { index: false },
};

export default function TrapManLoginPage() {
  return (
    <div className="trapman-login-page">
      <div className="trapman-login-container">
        <h1>Sign in to TrapMan</h1>
        <p className="trapman-login-subtitle">
          Track your run, see your stats, and manage your account.
        </p>
        <PlayerLoginForm />
      </div>
    </div>
  );
}
