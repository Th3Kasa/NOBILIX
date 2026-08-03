import type { Metadata } from "next";
import { LegalShell } from "@/app/(public)/trapman/_legal/legal-shell";
import {
  DeleteAccountRequest,
  SUPPORT_EMAIL,
} from "@/components/trapman/delete-account-request";

export const DELETE_ACCOUNT_LAST_UPDATED = "2026-08-04";

export const metadata: Metadata = {
  title: "Delete Account",
  description:
    "How to permanently delete your TrapMan player account and the personal data connected to it.",
  alternates: { canonical: "/trapman/delete-account" },
};

export default function TrapManDeleteAccountPage() {
  return (
    <LegalShell
      title="Delete Account"
      lastUpdated={DELETE_ACCOUNT_LAST_UPDATED}
      currentPath="/trapman/delete-account"
    >
      <section id="how-to-delete">
        <h2>How to delete your TrapMan account</h2>
        <p>
          Account deletion is handled by our support team over email. Send us
          the request below and we&apos;ll remove your account and the personal
          data connected to it.
        </p>
        <ol className="delete-steps">
          <li>
            Choose <strong>Open this email to send</strong> below. Your email
            app opens with the address, subject and message already written.
          </li>
          <li>
            Fill in your <strong>TrapMan username</strong> and the{" "}
            <strong>email address your game account uses</strong>.
          </li>
          <li>
            Send it <strong>from that same email address</strong> — that is how
            we confirm the account is yours before deleting anything.
          </li>
          <li>
            We process deletion requests in accordance with applicable law and
            reply to confirm once your account has been removed.
          </li>
        </ol>

        <DeleteAccountRequest />

        <p>
          If you no longer have access to that email address, contact us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> anyway and
          we&apos;ll work out another way to verify the account with you.
        </p>
      </section>

      <section id="what-is-deleted">
        <h2>What gets deleted</h2>
        <p>
          Deleting your TrapMan account is permanent and cannot be undone. The
          following is removed:
        </p>
        <ul>
          <li>Your player profile (username, email, country)</li>
          <li>Your game progress and competition history</li>
          <li>Your leaderboard entry (removed or anonymised)</li>
          <li>Your sign-in record</li>
        </ul>
        <p>
          <strong>Purchase receipts</strong> may be retained for financial
          compliance and dispute resolution. Personal identifiers within
          retained purchase records are anonymised.
        </p>
        <p>
          Aggregated analytics data follows the documented deletion timelines of
          the analytics provider and may not be removed instantly. Aggregated
          data that carries no personal identifiers may persist.
        </p>
      </section>

      <section id="under-13">
        <h2>Parent or guardian requests (under 13)</h2>
        <p>
          TrapMan is intended for players aged 13 and over. If you believe your
          child under 13 has created a TrapMan account, contact us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We process
          deletion requests from parents and guardians in accordance with
          applicable law.
        </p>
      </section>
    </LegalShell>
  );
}
