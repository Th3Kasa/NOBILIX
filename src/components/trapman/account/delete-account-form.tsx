"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const REQUIRED_CONFIRMATION = "DELETE TRAPMAN";

type FormState =
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success" };

export function DeleteAccountForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [confirmation, setConfirmation] = useState("");

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (confirmation !== REQUIRED_CONFIRMATION) {
      setState({
        status: "error",
        message: `Please type "${REQUIRED_CONFIRMATION}" exactly to confirm.`,
      });
      return;
    }

    setState({ status: "loading" });

    try {
      const response = await fetch("/api/player/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });

      if (response.status === 401) {
        setState({
          status: "error",
          message:
            "Your session has expired or requires re-authentication. Please sign in again and try immediately.",
        });
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setState({
          status: "error",
          message:
            data.error ??
            "We could not process your deletion request. Please try again or contact help.nobilix@outlook.com.",
        });
        return;
      }

      setState({ status: "success" });
      // Brief pause before redirect to show success message
      setTimeout(() => {
        router.replace("/trapman");
      }, 3000);
    } catch {
      setState({
        status: "error",
        message:
          "A network error occurred. Please try again or contact help.nobilix@outlook.com.",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div className="delete-account-success" role="status">
        <p>
          Your account has been successfully deleted. You will be redirected
          shortly.
        </p>
        <Link href="/trapman" className="delete-account-continue-link">
          Return to TrapMan now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleDelete} className="delete-account-form">
      {state.status === "error" && (
        <p className="delete-account-error" role="alert">
          {state.message}
        </p>
      )}

      <div id="delete-account-warning" className="delete-account-warning">
        <p>
          <strong>This action is permanent and cannot be undone.</strong> Your
          profile, progress, and leaderboard entry will be deleted.
        </p>
      </div>

      <div className="delete-account-reauthenticate-notice">
        <p>
          For security, this deletion must be performed within 5 minutes of
          signing in. If you signed in more than 5 minutes ago, please{" "}
          <a href="/trapman/account/login">sign in again</a> before proceeding.
        </p>
      </div>

      <label htmlFor="delete-confirmation" className="delete-account-label">
        Type <strong>{REQUIRED_CONFIRMATION}</strong> to confirm:
      </label>
      <input
        id="delete-confirmation"
        aria-describedby="delete-account-warning"
        type="text"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        required
        autoComplete="off"
        disabled={state.status === "loading"}
        className="delete-account-input"
        placeholder={REQUIRED_CONFIRMATION}
      />

      <button
        type="submit"
        disabled={
          state.status === "loading" ||
          confirmation !== REQUIRED_CONFIRMATION
        }
        className="delete-account-submit-btn"
      >
        {state.status === "loading"
          ? "Deleting account…"
          : "Permanently delete my account"}
      </button>

      <p className="delete-account-support-note">
        Need help? Contact{" "}
        <a href="mailto:help.nobilix@outlook.com">help.nobilix@outlook.com</a>.
      </p>
    </form>
  );
}
