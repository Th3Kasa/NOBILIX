import type { Metadata } from "next";
import { LegalShell } from "@/app/(public)/trapman/_legal/legal-shell";
import { getPlayerSession } from "@/lib/player-session";
import { DeleteAccountForm } from "@/components/trapman/account/delete-account-form";

export const metadata: Metadata = {
  title: "Delete Account — TrapMan",
  description:
    "Permanently delete your TrapMan player account and associated data.",
  robots: { index: false },
};

export default async function TrapManDeleteAccountPage() {
  // Check if user is authenticated (authenticated deletion vs. support request path)
  const session = await getPlayerSession();

  return (
    <LegalShell
      title="Delete Account"
      lastUpdated="2026-06-22"
      currentPath="/trapman/delete-account"
    >
      <section id="overview">
        <h2>Account Deletion</h2>
        <p>
          Deleting your TrapMan account is permanent and cannot be undone.
          The following data is removed on deletion:
        </p>
        <ul>
          <li>Your player profile (username, email, country)</li>
          <li>Your game progress and competition history</li>
          <li>Your leaderboard entry (removed or anonymized)</li>
          <li>Your Firebase Auth record</li>
        </ul>
        <p>
          <strong>Purchase receipts</strong> may be retained for financial
          compliance and dispute resolution. Personal identifiers within
          retained purchase records are anonymized.
        </p>
        <p>
          Firebase Analytics aggregated event data follows Firebase&apos;s documented
          deletion timelines and may not be removed instantly.
        </p>
      </section>

      <section id="under-13">
        <h2>Parent or Guardian Deletion Request (Under 13)</h2>
        <p>
          TrapMan is intended for players aged 13 and over. If you believe your
          child under 13 has created a TrapMan account, please contact us at{" "}
          <a href="mailto:help.nobilix@outlook.com">help.nobilix@outlook.com</a>. We will
          process deletion requests from parents and guardians in accordance
          with applicable law.
        </p>
      </section>

      <section id="delete-form">
        <h2>
          {session ? "Delete Your Account" : "Sign In to Delete Your Account"}
        </h2>

        {session ? (
          <DeleteAccountForm />
        ) : (
          <div className="delete-account-unauthenticated">
            <p>
              To delete your account, you must first sign in so we can verify
              your identity.
            </p>
            <a
              href="/trapman/account/login"
              className="delete-account-signin-btn"
            >
              Sign in to continue
            </a>
            <p className="delete-account-support-note">
              If you no longer have access to your account, contact{" "}
              <a href="mailto:help.nobilix@outlook.com">help.nobilix@outlook.com</a> for
              assisted deletion.
            </p>
          </div>
        )}
      </section>
    </LegalShell>
  );
}
