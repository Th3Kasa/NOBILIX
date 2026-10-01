"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Send, Users, Globe, User, CheckCircle2, AlertCircle } from "lucide-react";
import {
  sendCampaignAction,
  previewAction,
  type SendState,
  type PreviewState,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Audience = "single" | "segment" | "broadcast";

const TITLE_MAX = 120;
const BODY_MAX = 1000;
/** Only announce the counter to screen readers once the room left starts
 *  feeling tight — otherwise every keystroke would spam aria-live. */
const NEAR_LIMIT = 20;

function CharCounter({ length, max }: { length: number; max: number }) {
  const remaining = max - length;
  const near = remaining <= NEAR_LIMIT;
  return (
    <p
      className={cn(
        "text-right font-mono text-xs tabular-nums",
        near ? "text-[var(--console-action)]" : "text-muted-foreground",
      )}
      aria-live={near ? "polite" : "off"}
    >
      {length}/{max}
    </p>
  );
}

/**
 * What actually happened, in three distinguishable outcomes: delivered,
 * reached nobody (usually normal), and failed for everyone (usually a
 * configuration fault worth acting on). Collapsing these into one green
 * "sent" banner is how a broken APNs key stays invisible for weeks.
 */
function SendOutcome({ summary }: { summary: NonNullable<SendState["summary"]> }) {
  const nobodyToSendTo = summary.recipients === 0;
  const allFailed = summary.recipients > 0 && summary.success === 0;
  const tone = nobodyToSendTo || allFailed ? "action" : "live";

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
        tone === "live"
          ? "border-[var(--console-live-border)] bg-[var(--console-live-tint)] text-[var(--console-live)]"
          : "border-[var(--console-action-border)] bg-[var(--console-action-tint)] text-[var(--console-action)]",
      )}
    >
      {tone === "live" ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="min-w-0">
        {nobodyToSendTo ? (
          <>
            <p className="font-medium">Nothing was sent — nobody to send to.</p>
            <p className="mt-0.5 text-muted-foreground">
              {summary.matched === 0
                ? "No players matched this audience."
                : `All ${summary.matched} matching player${summary.matched === 1 ? " has" : "s have"} notifications turned off, so the game has no device to send to.`}
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">
              {allFailed
                ? `Failed for all ${summary.recipients} device${summary.recipients === 1 ? "" : "s"}.`
                : `Delivered to ${summary.success} of ${summary.recipients} device${summary.recipients === 1 ? "" : "s"}.`}
            </p>
            {summary.unreachable > 0 && (
              <p className="mt-0.5 text-muted-foreground">
                {summary.unreachable} matching player
                {summary.unreachable === 1 ? "" : "s"} could not be sent to at
                all — notifications are off for them.
              </p>
            )}
            {summary.failures.length > 0 && (
              <ul className="mt-1.5 space-y-1 text-muted-foreground">
                {summary.failures.map((f) => (
                  <li key={f.code}>
                    <span className="font-mono tabular-nums">{f.count}×</span>{" "}
                    {f.reason}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      <Send className="size-4" />
      {pending ? "Sending…" : "Send notification"}
    </Button>
  );
}

export function Compose({ prefillUid }: { prefillUid?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const defaultAudience: Audience = prefillUid ? "single" : "broadcast";
  const [audience, setAudience] = useState<Audience>(defaultAudience);
  const [titleLength, setTitleLength] = useState(0);
  const [bodyLength, setBodyLength] = useState(0);
  // True once any audience/field input changes after a preview was computed
  // — the shown count is no longer trustworthy until previewed again.
  const [previewStale, setPreviewStale] = useState(false);
  // True right after a successful send — hides the (now-reset) preview
  // rather than showing a stale count for a blank form.
  const [previewDismissed, setPreviewDismissed] = useState(false);

  const [preview, previewDispatch, previewPending] = useActionState(
    async (prev: PreviewState, fd: FormData) => {
      const res = await previewAction(prev, fd);
      // A fresh preview just landed — whatever made the old one stale (or
      // hidden after a send) no longer applies.
      setPreviewStale(false);
      setPreviewDismissed(false);
      return res;
    },
    {},
  );
  const [state, formAction] = useActionState<SendState, FormData>(
    async (prev, fd) => {
      const res = await sendCampaignAction(prev, fd);
      if (res.ok) {
        router.refresh();
        formRef.current?.reset();
        setAudience(defaultAudience);
        setTitleLength(0);
        setBodyLength(0);
        setPreviewDismissed(true);
        setPreviewStale(false);
      }
      return res;
    },
    {},
  );

  function markFieldsChanged() {
    setPreviewStale(true);
  }

  function handleAudienceChange(value: Audience) {
    setAudience(value);
    markFieldsChanged();
  }

  const tabs: { value: Audience; label: string; icon: typeof User }[] = [
    { value: "single", label: "One player", icon: User },
    { value: "segment", label: "Segment", icon: Users },
    { value: "broadcast", label: "Everyone", icon: Globe },
  ];

  return (
    <Card className="console-glass console-hairline-glow">
      <CardHeader>
        <CardTitle>Compose notification</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          onChange={markFieldsChanged}
          className="space-y-4"
        >
          {/* Audience selector */}
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((t) => {
              const active = audience === t.value;
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => handleAudienceChange(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md border p-3 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  <t.icon className="size-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="audienceType" value={audience} />

          {audience === "single" && (
            <div className="space-y-1.5">
              <Label htmlFor="uid">Player ID</Label>
              <Input
                id="uid"
                name="uid"
                defaultValue={prefillUid}
                placeholder="Firebase UID"
                required
              />
            </div>
          )}

          {/* Only fields the game actually writes appear here. A filter on a
              field no player document has returns an empty audience, which is
              indistinguishable from "nobody qualifies" — so "Character" was
              removed rather than left as a trap. */}
          {audience === "segment" && (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="country">Country (ISO)</Label>
                <Input id="country" name="country" maxLength={2} className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastActiveDays">Active within (days)</Label>
                <Input id="lastActiveDays" name="lastActiveDays" type="number" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minLevel">Min level</Label>
                <Input id="minLevel" name="minLevel" type="number" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxLevel">Max level</Label>
                <Input id="maxLevel" name="maxLevel" type="number" />
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">
                &ldquo;Active within&rdquo; uses the last time the game synced
                the player&apos;s progress, which only{" "}
                <span className="font-medium">some</span> players have recorded.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              maxLength={TITLE_MAX}
              required
              placeholder="New event is live!"
              onChange={(e) => setTitleLength(e.target.value.length)}
            />
            <CharCounter length={titleLength} max={TITLE_MAX} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              name="body"
              maxLength={BODY_MAX}
              required
              placeholder="Tap to claim your reward…"
              onChange={(e) => setBodyLength(e.target.value.length)}
            />
            <CharCounter length={bodyLength} max={BODY_MAX} />
          </div>

          {/* A preview of 0 is the usual outcome and almost never a fault, so
              it is explained rather than just reported: most players have
              never granted notification permission and have no device token. */}
          {!previewDismissed && preview.count != null && (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
              <p>
                This will reach{" "}
                <span className="font-mono font-semibold tabular-nums">
                  {preview.count}
                </span>{" "}
                device{preview.count === 1 ? "" : "s"}
                {preview.matched != null && (
                  <>
                    {" "}
                    out of{" "}
                    <span className="font-mono tabular-nums">
                      {preview.matched}
                    </span>{" "}
                    matching player{preview.matched === 1 ? "" : "s"}
                  </>
                )}
                .
              </p>
              {!!preview.unreachable && (
                <p className="mt-1 text-muted-foreground">
                  {preview.unreachable} of them cannot be reached — they have
                  not allowed notifications, so the game has no device to send
                  to.
                </p>
              )}
              {!!preview.sharedDevices && (
                <p className="mt-1 text-muted-foreground">
                  {preview.sharedDevices} share a device with another player in
                  this audience, so that device is sent to once.
                </p>
              )}
              {previewStale && (
                <p className="mt-1 text-[var(--console-action)]">
                  Estimate outdated — preview again.
                </p>
              )}
            </div>
          )}
          {!previewDismissed && preview.error && (
            <p className="text-sm text-destructive">{preview.error}</p>
          )}

          {state.error && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--console-action-border)] bg-[var(--console-action-tint)] px-3 py-2 text-sm text-[var(--console-action)]">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          {state.ok && state.summary && (
            <SendOutcome summary={state.summary} />
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="outline"
              formAction={previewDispatch}
              disabled={previewPending}
            >
              {previewPending ? "Counting…" : "Preview audience"}
            </Button>
            <SendButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
