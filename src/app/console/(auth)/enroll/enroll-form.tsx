"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";
import {
  beginEnrollment,
  confirmEnrollment,
  type BeginState,
  type ConfirmState,
} from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EnrollForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [begin, beginAction] = useActionState<BeginState, FormData>(
    beginEnrollment,
    {},
  );
  const [confirm, confirmAction] = useActionState<ConfirmState, FormData>(
    confirmEnrollment,
    {},
  );

  if (confirm.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-6" />
        </div>
        <p className="text-sm text-muted-foreground">
          Two-factor authentication is now active. You can sign in with your
          authenticator code.
        </p>
        <Link href="/console/login" className={buttonVariants({ className: "w-full" })}>
          Go to sign in
        </Link>
      </div>
    );
  }

  // Step 2 — QR shown, confirm a code.
  if (begin.qrDataUrl) {
    return (
      <form action={confirmAction} className="space-y-4">
        <ol className="space-y-1 text-sm text-muted-foreground">
          <li>1. Open Google Authenticator or Authy.</li>
          <li>2. Scan the QR code below.</li>
          <li>3. Enter the 6-digit code it shows.</li>
        </ol>

        <div className="flex justify-center rounded-lg border border-border bg-white p-3">
          <Image
            src={begin.qrDataUrl}
            alt="TOTP QR code"
            width={200}
            height={200}
            unoptimized
          />
        </div>

        {begin.manualKey && (
          <div className="rounded-md border border-border bg-muted/40 p-2">
            <p className="mb-1 text-xs text-muted-foreground">
              Or enter this key manually:
            </p>
            <code className="flex items-center justify-between gap-2 break-all font-mono text-xs">
              {begin.manualKey}
              <button
                type="button"
                aria-label="Copy key"
                onClick={() =>
                  navigator.clipboard?.writeText(begin.manualKey ?? "")
                }
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="size-3.5" />
              </button>
            </code>
          </div>
        )}

        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />

        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            placeholder="6-digit code"
            className="text-center font-mono tracking-[0.4em]"
          />
        </div>

        {confirm.error && <ErrorBox message={confirm.error} />}
        <Submit label="Activate 2FA" pendingLabel="Confirming…" />
      </form>
    );
  }

  // Step 1 — verify identity.
  return (
    <form action={beginAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@nobilix.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      {begin.error && <ErrorBox message={begin.error} />}
      <Submit label="Continue" pendingLabel="Checking…" />
    </form>
  );
}
