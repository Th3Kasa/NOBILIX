"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { ShieldCheck, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { loginAction, type LoginState, type LoginStep } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} size="lg">
      {pending ? "Please wait…" : label}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {
    step: "credentials",
  });

  // Email + password are captured in step 1 and carried (hidden) through the
  // later steps so the server can finish authentication.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<LoginStep>("credentials");

  // Advance the visible step whenever the server tells us to.
  useEffect(() => {
    // The server action is the source of truth for this multi-step form.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.step && state.step !== step) setStep(state.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  const onCredentials = step === "credentials";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="phase" value={step} />
      <ol className="console-step-list grid grid-cols-2 gap-2 font-mono text-xs font-semibold uppercase tracking-wide">
        <li
          aria-current={step === "credentials" ? "step" : undefined}
          className={`border-b-2 pb-2 transition-colors ${
            onCredentials
              ? "border-primary text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          1. Credentials
        </li>
        <li
          aria-current={step !== "credentials" ? "step" : undefined}
          className={`border-b-2 pb-2 text-right transition-colors ${
            !onCredentials
              ? "border-primary text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          2. Two-factor
        </li>
      </ol>

      {onCredentials ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="admin@nobilix.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          {/* Carry credentials forward without showing them. */}
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="password" value={password} />

          {step === "enroll" && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 text-center">
              <p className="text-sm font-medium">Set up your authenticator</p>
              <p className="text-xs text-muted-foreground">
                Scan this QR code with Google Authenticator, Authy, or 1Password,
                then enter the 6-digit code it shows.
              </p>
              {state.qrDataUrl && (
                <div className="flex justify-center">
                  <Image
                    src={state.qrDataUrl}
                    alt="Two-factor QR code"
                    width={180}
                    height={180}
                    unoptimized
                    className="rounded-lg border border-border bg-white p-2"
                  />
                </div>
              )}
              {state.manualKey && (
                <details className="text-left">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Can&apos;t scan? Enter a key instead
                  </summary>
                  <code className="mt-2 block break-all rounded bg-background px-2 py-1 font-mono text-xs">
                    {state.manualKey}
                  </code>
                </details>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code" className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" />
              {step === "enroll" ? "Enter the code to confirm" : "Authentication code"}
            </Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              placeholder="6-digit code"
              className="text-center font-mono tracking-[0.4em]"
            />
          </div>
        </>
      )}

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton
        label={
          onCredentials
            ? "Continue"
            : step === "enroll"
              ? "Verify & finish setup"
              : "Sign in"
        }
      />

      {!onCredentials && (
        <button
          type="button"
          onClick={() => setStep("credentials")}
          className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Use a different account
        </button>
      )}

      {onCredentials && (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <KeyRound className="size-3" />
          First time? You&apos;ll set up two-factor right after this step.
        </p>
      )}
    </form>
  );
}
