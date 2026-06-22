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

  return (
    <>
      <Link
        href="/console/trapman/users"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
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
                href={`/console/messaging?uid=${user.uid}`}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
              value={user.level != null ? formatNumber(user.level) : "—"}
            />
            <Field
              label="High score"
              value={
                user.highScore != null ? formatNumber(user.highScore) : "—"
              }
            />
            <Field
              label="Account type"
              value={
                user.isGuest ? (
                  <Badge variant="secondary">Guest</Badge>
                ) : (
                  <Badge variant="success">Registered</Badge>
                )
              }
            />
            <Field
              label="Push enabled"
              value={
                user.fcmToken ? (
                  <span className="inline-flex items-center gap-1 text-success">
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
    </>
  );
}
