"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountActions() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/player/session", { method: "DELETE" });
    } finally {
      router.replace("/trapman");
    }
  }

  return (
    <section className="player-account-actions" aria-labelledby="actions-heading">
      <h2 id="actions-heading">Account Actions</h2>

      <div className="player-action-group">
        <a
          href="/api/player/export"
          className="player-action-btn player-action-btn--export"
          download="trapman-data.json"
        >
          Download my data (JSON)
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="player-action-btn player-action-btn--signout"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      <div className="player-danger-zone">
        <p>Deletion is permanent and has its own confirmation flow.</p>
        <a
          href="/trapman/delete-account"
          className="player-action-btn player-action-btn--delete"
        >
          Delete my account
        </a>
      </div>
    </section>
  );
}
