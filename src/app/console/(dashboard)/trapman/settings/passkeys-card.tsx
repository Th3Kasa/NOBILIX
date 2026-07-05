"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Fingerprint,
  KeyRound,
  Pencil,
  Trash2,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  finishPasskeyRegistration,
  removePasskeyAction,
  renamePasskeyAction,
  startPasskeyRegistration,
} from "./passkey-actions";

export interface PasskeyListItem {
  credentialId: string;
  name: string;
  createdAt: number;
  lastUsedAt: number | null;
  backedUp: boolean;
}

export function PasskeysCard({
  passkeys,
  enabled,
}: {
  passkeys: PasskeyListItem[];
  enabled: boolean;
}) {
  const router = useRouter();
  const [supported, setSupported] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [removing, setRemoving] = React.useState<PasskeyListItem | null>(null);

  React.useEffect(() => {
    // Support is browser-only knowledge; the server always renders "off".
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(browserSupportsWebAuthn());
  }, []);

  async function handleAdd() {
    setBusy(true);
    setError(null);
    try {
      const start = await startPasskeyRegistration();
      if (!start.ok) {
        setError(start.error);
        return;
      }
      const response = await startRegistration(start.options);
      const result = await finishPasskeyRegistration(response);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") return;
      if (err instanceof Error && err.name === "InvalidStateError") {
        setError("This device already has a passkey for your account.");
        return;
      }
      setError("Couldn't add a passkey. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(credentialId: string) {
    const name = renameValue.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    const result = await renamePasskeyAction({ credentialId, name });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRenaming(null);
    router.refresh();
  }

  async function handleRemove() {
    if (!removing) return;
    setBusy(true);
    setError(null);
    const result = await removePasskeyAction({
      credentialId: removing.credentialId,
    });
    setBusy(false);
    setRemoving(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Passkeys aren&apos;t set up for this deployment yet. They&apos;ll appear
        here once the WebAuthn settings are added to the environment.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A passkey signs you in with your fingerprint, face, or device PIN —
        no password or code to type. Your password and authenticator app keep
        working as a backup.
      </p>

      {passkeys.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {passkeys.map((pk) => (
            <li key={pk.credentialId} className="flex items-center gap-3 p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <KeyRound className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                {renaming === pk.credentialId ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      maxLength={60}
                      autoFocus
                      className="h-9"
                      aria-label="Passkey name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleRename(pk.credentialId);
                        }
                        if (e.key === "Escape") setRenaming(null);
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Save name"
                      onClick={() => handleRename(pk.credentialId)}
                      disabled={busy}
                    >
                      <Check aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      {pk.name}
                      {pk.backedUp && (
                        <Badge variant="success" className="shrink-0">
                          Synced
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {format(new Date(pk.createdAt), "PP")}
                      {pk.lastUsedAt
                        ? ` · last used ${format(new Date(pk.lastUsedAt), "PP")}`
                        : " · never used"}
                    </p>
                  </>
                )}
              </div>
              {renaming !== pk.credentialId && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Rename ${pk.name}`}
                    onClick={() => {
                      setRenaming(pk.credentialId);
                      setRenameValue(pk.name);
                    }}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${pk.name}`}
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRemoving(pk)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {supported ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          loading={busy && renaming === null && removing === null}
          loadingLabel="Waiting for your device"
        >
          {!busy && <Fingerprint aria-hidden="true" />}
          Add a passkey
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          This browser doesn&apos;t support passkeys.
        </p>
      )}

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this passkey?"
        description={
          removing
            ? `"${removing.name}" will stop working immediately. You can always sign in with your password and authenticator app.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRemoving(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            loading={busy}
            loadingLabel="Removing passkey"
          >
            Remove passkey
          </Button>
        </div>
      </Modal>
    </div>
  );
}
