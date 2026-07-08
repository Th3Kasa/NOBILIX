"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Send, Users, Globe, User, CheckCircle2, AlertCircle } from "lucide-react";
import {
  sendCampaignAction,
  previewAction,
  type SendState,
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
    async (prev: { count?: number; error?: string }, fd: FormData) => {
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

          {audience === "segment" && (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="country">Country (ISO)</Label>
                <Input id="country" name="country" maxLength={2} className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="character">Character</Label>
                <Input id="character" name="character" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minLevel">Min level</Label>
                <Input id="minLevel" name="minLevel" type="number" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxLevel">Max level</Label>
                <Input id="maxLevel" name="maxLevel" type="number" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="lastActiveDays">Active within (days)</Label>
                <Input id="lastActiveDays" name="lastActiveDays" type="number" />
              </div>
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

          {!previewDismissed && preview.count != null && (
            <p className="text-sm text-muted-foreground">
              Estimated recipients with push enabled:{" "}
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {preview.count}
              </span>
              {previewStale && (
                <span className="ml-2 text-[var(--console-action)]">
                  — estimate outdated, preview again
                </span>
              )}
            </p>
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
            <div className="flex items-start gap-2 rounded-md border border-[var(--console-live-border)] bg-[var(--console-live-tint)] px-3 py-2 text-sm text-[var(--console-live)]">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span className="font-mono tabular-nums">
                Sent to {state.summary.recipients} recipient(s) —{" "}
                {state.summary.success} delivered, {state.summary.failure} failed.
              </span>
            </div>
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
