"use client";

import * as React from "react";
import { Fingerprint, AlertCircle } from "lucide-react";
import {
  browserSupportsWebAuthn,
  startAuthentication,
} from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { finishPasskeyLogin, startPasskeyLogin } from "./passkey-actions";

export function PasskeyLoginButton() {
  const [supported, setSupported] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // WebAuthn support is only knowable in the browser; render nothing on
    // the server and until the check runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(browserSupportsWebAuthn());
  }, []);

  if (!supported) return null;

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const start = await startPasskeyLogin();
      if (!start.ok) {
        setError(start.error);
        return;
      }
      const assertion = await startAuthentication(start.options);
      const result = await finishPasskeyLogin(assertion);
      // Success redirects server-side; reaching here means it failed.
      setError(result.error);
    } catch (err) {
      // User closed the browser prompt — not an error worth shouting about.
      if (err instanceof Error && err.name === "NotAllowedError") return;
      setError("Passkey sign-in didn't complete. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleClick}
        loading={busy}
        loadingLabel="Waiting for your passkey"
      >
        {!busy && <Fingerprint aria-hidden="true" />}
        Sign in with a passkey
      </Button>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
