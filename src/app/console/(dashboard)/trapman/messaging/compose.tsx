"use client";

import { useActionState, useState } from "react";
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
  const [audience, setAudience] = useState<Audience>(
    prefillUid ? "single" : "broadcast",
  );
  const [preview, previewDispatch] = useActionState(previewAction, {});
  const [state, formAction] = useActionState<SendState, FormData>(
    async (prev, fd) => {
      const res = await sendCampaignAction(prev, fd);
      if (res.ok) router.refresh();
      return res;
    },
    {},
  );

  const tabs: { value: Audience; label: string; icon: typeof User }[] = [
    { value: "single", label: "One player", icon: User },
    { value: "segment", label: "Segment", icon: Users },
    { value: "broadcast", label: "Everyone", icon: Globe },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose notification</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* Audience selector */}
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((t) => {
              const active = audience === t.value;
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setAudience(t.value)}
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
            <Input id="title" name="title" maxLength={120} required placeholder="New event is live!" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" name="body" maxLength={1000} required placeholder="Tap to claim your reward…" />
          </div>

          {preview.count != null && (
            <p className="text-sm text-muted-foreground">
              Estimated recipients with push enabled:{" "}
              <span className="font-semibold text-foreground">{preview.count}</span>
            </p>
          )}
          {preview.error && (
            <p className="text-sm text-destructive">{preview.error}</p>
          )}

          {state.error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          {state.ok && state.summary && (
            <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>
                Sent to {state.summary.recipients} recipient(s) —{" "}
                {state.summary.success} delivered, {state.summary.failure} failed.
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" variant="outline" formAction={previewDispatch}>
              Preview audience
            </Button>
            <SendButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
