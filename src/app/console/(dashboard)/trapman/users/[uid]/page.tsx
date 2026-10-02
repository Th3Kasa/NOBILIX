import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { auth } from "@/auth";
import { getUser, getAccountCreatedAt } from "@/lib/users";
import { getLeaderboardScore } from "@/lib/leaderboard";
import { readPlayerFields } from "@/lib/trapman/player-fields";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { countryFlag, formatNumber } from "@/lib/utils";
import { classifyPlayerEmail } from "@/lib/trapman/player-email";
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
  const [user, session, leaderboardScore, createdAt] = await Promise.all([
    getUser(uid),
    auth(),
    getLeaderboardScore(uid),
    getAccountCreatedAt(uid),
  ]);
  if (!user) notFound();

  const canWrite = session?.user?.role !== "viewer";
  const emailIdentity = classifyPlayerEmail(user.email);
  const ts = (v: number | null) => (v !== null ? format(new Date(v), "PPpp") : "—");

  // The same field rules every other tab uses (see player-fields), so this
  // page can't show a different level, name or status than the Players list.
  const player = readPlayerFields(user as unknown as Record<string, unknown>);

  return (
    <>
      <Link
        href="/console/trapman/users"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to players
      </Link>

      <PageHeader
        title={player.name ?? "(no name)"}
        description={user.email ?? user.uid}
        action={
          <div className="flex flex-wrap gap-2">
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
            <Field label="Name" value={player.name ?? "—"} />
            <Field
              label={emailIdentity.label}
              value={
                <span className="flex flex-col gap-0.5">
                  <span>{emailIdentity.address ?? "—"}</span>
                  {emailIdentity.kind !== "real" && (
                    <span className="text-xs text-muted-foreground">
                      {emailIdentity.note}
                    </span>
                  )}
                </span>
              }
            />
            <Field
              label="Country"
              value={
                player.country
                  ? `${countryFlag(player.country)} ${player.country}`
                  : "—"
              }
            />
            <Field label="Character" value={user.character ?? "—"} />
            <Field
              label="Highest level reached"
              value={
                <span className="font-mono tabular-nums">
                  {player.highestLevel != null ? formatNumber(player.highestLevel) : "—"}
                </span>
              }
            />
            <Field
              label="Current level"
              value={
                <span className="font-mono tabular-nums">
                  {player.currentLevel != null ? formatNumber(player.currentLevel) : "—"}
                </span>
              }
            />
            <Field
              label="Levels completed"
              value={
                <span className="font-mono tabular-nums">
                  {formatNumber(player.levelsCompleted)}
                </span>
              }
            />
            <Field
              label="Leaderboard score"
              value={
                <span className="font-mono tabular-nums">
                  {leaderboardScore != null ? formatNumber(leaderboardScore) : "—"}
                </span>
              }
            />
            <Field
              label="Account type"
              value={
                player.isGuest ? (
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
              label="Notifications allowed"
              value={
                player.pushToken ? (
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
            <Field label="Account created" value={ts(createdAt)} />
            <Field label="Last played" value={ts(player.lastSeenMs)} />
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
              currentLevel: player.currentLevel ?? 0,
              highScore: leaderboardScore ?? 0,
            }}
          />
        </div>
      </div>
    </>
  );
}
