import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Send, Bell, BellOff } from "lucide-react";
import { auth } from "@/auth";
import { getUser } from "@/lib/users";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { countryFlag, formatNumber } from "@/lib/utils";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const [user, session] = await Promise.all([getUser(uid), auth()]);
  if (!user) notFound();

  const canWrite = session?.user?.role !== "viewer";
  const ts = (v: unknown) =>
    typeof v === "number" ? format(new Date(v), "PPpp") : "—";

  // The live game writes currentLevel/completedLevels, not the documented
  // level field; the mapper preserves them as extra properties.
  const extra = user as unknown as {
    currentLevel?: unknown;
    completedLevels?: unknown;
  };
  const currentLevel =
    typeof extra.currentLevel === "number" ? extra.currentLevel : null;
  const completedLevels = Array.isArray(extra.completedLevels)
    ? extra.completedLevels.length
    : null;

  return (
    <>
      <Link
        href="/console/trapman/users"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to players
      </Link>

      <PageHeader
        title={user.displayName ?? "(no name)"}
        description={user.email ?? user.uid}
        action={
          <div className="flex flex-wrap gap-2">
            {user.fcmToken ? (
              <Link
                href={`/console/trapman/messaging?uid=${user.uid}`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Send className="size-4" /> Push
              </Link>
            ) : null}
            <a
              href={`/api/users/${user.uid}/export`}
              className={buttonVariants({ variant: "outline" })}
            >
              Export JSON
            </a>
          </div>
        }
      />

      <div className="console-page-grid">
        <Card className="console-glass console-grid-span-8">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Field
              label="Player ID"
              value={<span className="font-mono text-xs">{user.uid}</span>}
            />
            <Field label="Display name" value={user.displayName ?? "—"} />
            <Field label="Email" value={user.email ?? "—"} />
            <Field
              label="Country"
              value={
                user.country
                  ? `${countryFlag(user.country)} ${user.country}`
                  : "—"
              }
            />
            <Field label="Character" value={user.character ?? "—"} />
            <Field
              label="Level"
              value={
                <span className="font-mono tabular-nums">
                  {(currentLevel ?? user.level) != null
                    ? formatNumber((currentLevel ?? user.level) as number)
                    : "—"}
                </span>
              }
            />
            <Field
              label="Levels completed"
              value={
                <span className="font-mono tabular-nums">
                  {completedLevels != null ? formatNumber(completedLevels) : "—"}
                </span>
              }
            />
            <Field
              label="High score"
              value={
                <span className="font-mono tabular-nums">
                  {user.highScore != null ? formatNumber(user.highScore) : "—"}
                </span>
              }
            />
            <Field
              label="Account type"
              value={
                user.isGuest ? (
                  <Badge variant="secondary" className="font-mono uppercase tracking-wide">
                    Guest
                  </Badge>
                ) : (
                  <Badge variant="success" className="font-mono uppercase tracking-wide">
                    Registered
                  </Badge>
                )
              }
            />
            <Field
              label="Push enabled"
              value={
                user.fcmToken ? (
                  <span className="inline-flex items-center gap-1 text-[var(--console-live)]">
                    <Bell className="size-3.5" /> Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <BellOff className="size-3.5" /> No
                  </span>
                )
              }
            />
            <Field label="Created" value={ts(user.createdAt)} />
            <Field label="Last seen" value={ts(user.lastSeenAt)} />
          </CardContent>
        </Card>

        <div className="console-grid-span-4">
          <UserActions
            uid={user.uid}
            canWrite={canWrite}
            initial={{
              displayName: user.displayName ?? "",
              country: user.country ?? "",
              character: user.character ?? "",
              level: user.level ?? 0,
              highScore: user.highScore ?? 0,
            }}
          />
        </div>
      </div>
    </>
  );
}
