"use client";

import { useState } from "react";
import { Check, Copy, Info, Mail } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { classifyPlayerEmail } from "@/lib/trapman/player-email";
import { buildPrizeEmail, mailtoLink } from "@/lib/trapman/prize-email";

/**
 * Contact a winner about their prize.
 *
 * Opens a pre-written message the operator can edit, then hands it to their
 * own email app — so every prize email is reviewed by a person and replies go
 * to an inbox someone reads. Nothing is sent by the console itself.
 */
export function EmailWinnerButton({
  uid,
  email,
  displayName,
  rank,
  score,
  competition = null,
}: {
  uid: string;
  email: string | null | undefined;
  displayName?: string | null;
  rank?: number | null;
  score: number;
  /** Name of an archived competition; omit for the live board. */
  competition?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const identity = classifyPlayerEmail(email);
  const draft = buildPrizeEmail({ displayName, rank, score, competition });
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [copied, setCopied] = useState(false);
  const who = displayName ?? uid;

  if (!identity.contactable || !identity.address) {
    return (
      <span
        title="No email on this account (guest player) — they can't be contacted by email."
        aria-label={`${who} has no email address`}
        className="inline-flex size-11 shrink-0 cursor-not-allowed items-center justify-center text-muted-foreground/30"
      >
        <Mail className="size-4" aria-hidden="true" />
      </span>
    );
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(
        `To: ${identity.address}\nSubject: ${subject}\n\n${body}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by the browser; the text is still on screen.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // Start from a fresh draft each time, so it reflects the current score.
          setSubject(draft.subject);
          setBody(draft.body);
          setOpen(true);
        }}
        aria-label={`Email ${who} about their prize`}
        title="Email this player"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Mail className="size-4" aria-hidden="true" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Email ${who}`}
        description="Edit the message, then open it in your email app to send."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>To</Label>
            <p className="break-all rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm">
              {identity.address}
            </p>
          </div>

          {identity.kind === "apple-relay" && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--console-action-border)] bg-[var(--console-action-tint)] p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--console-action)]" aria-hidden="true" />
              <span>
                This is an Apple &ldquo;Hide My Email&rdquo; address. Apple only
                forwards mail from senders registered under Apple Developer →
                Certificates, Identifiers &amp; Profiles → Services → Sign in
                with Apple for Email Communication. Send from a registered
                address, or Apple will bounce it.
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={`prize-subject-${uid}`}>Subject</Label>
            <Input
              id={`prize-subject-${uid}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`prize-body-${uid}`}>Message</Label>
            <Textarea
              id={`prize-body-${uid}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={copyMessage} className="gap-1.5">
              {copied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy message"}
            </Button>
            <a
              href={mailtoLink(identity.address, subject, body)}
              onClick={() => setOpen(false)}
              className={cn(buttonVariants(), "flex-1 gap-1.5")}
            >
              <Mail className="size-4" aria-hidden="true" />
              Open in email app
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
