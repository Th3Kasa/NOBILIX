import Link from "next/link";
import { LocalTime } from "@/components/console/local-time";
import { notFound } from "next/navigation";
import { ArrowLeft, Bell, BellOff, Receipt } from "lucide-react";
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
import { productLabel, platformLabel } from "@/lib/trapman/labels";
import { UserActions } from "./user-actions";
import { getPurchasesData, summarise } from "../../purchases/data";
import { EXCLUSION_COPY, VERDICT_BADGE } from "../../purchases/copy";
import {
  getAudRates,
  convertToAud,
  formatAud,
  formatAudTotal,
  formatOriginal,
  sumInAud,
} from "../../fx";

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
  const [user, session, leaderboardScore, createdAt, purchasesData, fx] = await Promise.all([
    getUser(uid),
    auth(),
    getLeaderboardScore(uid),
    getAccountCreatedAt(uid),
    // The Purchases page's own classified records (cached, shared), so a
    // purchase reads the same here as there — counted, test, refunded…
    getPurchasesData(),
    getAudRates(),
  ]);
  if (!user) notFound();

  const canWrite = session?.user?.role !== "viewer";
  const emailIdentity = classifyPlayerEmail(user.email);
  const ts = (v: number | null) =>
    v !== null ? <LocalTime ms={v} variant="datetime" /> : "—";

  // The same field rules every other tab uses (see player-fields), so this
  // page can't show a different level, name or status than the Players list.
  const player = readPlayerFields(user as unknown as Record<string, unknown>);

  const purchases = summarise(
    purchasesData.records.filter((r) => r.buyerUid === uid),
  );
  const spent = sumInAud(purchases.revenueByCurrency, fx);
  const aud = (amount: number, currency: string) => {
    const converted = fx.connected ? convertToAud(amount, currency, fx) : null;
    return converted != null ? formatAud(converted) : formatOriginal(amount, currency);
  };

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
            {/* Only once the game starts saving the chosen character. */}
            {user.character && <Field label="Character" value={user.character} />}
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

      <Card className="console-glass mt-6">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Receipt className="size-4 text-[var(--console-violet)]" aria-hidden="true" />
            Purchases
            {purchases.all.length > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {purchases.totalCount} counted · {formatAudTotal(spent)} spent
                {purchases.excludedTotal > 0 && ` · ${purchases.excludedTotal} not counted`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!purchasesData.connected ? (
            <p className="text-sm text-muted-foreground">
              Purchases couldn&apos;t be loaded right now.
            </p>
          ) : purchases.all.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This player hasn&apos;t bought anything.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">Product</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Price (AUD)</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Platform</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Counted?</th>
                    <th scope="col" className="py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.all.map((p) => {
                    const badge = VERDICT_BADGE[p.verification.verdict];
                    return (
                      <tr
                        key={p.purchaseId}
                        className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                      >
                        <td className="py-2.5 pr-4">
                          <div className="font-medium">{productLabel(p.productId)}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {p.productId}
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 font-mono tabular-nums">
                          {aud(p.price, p.currency)}
                          {p.currency !== "AUD" && (
                            <span className="ml-1.5 text-[11px] text-muted-foreground">
                              {formatOriginal(p.price, p.currency)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-xs">{platformLabel(p.platform)}</td>
                        <td className="py-2.5 pr-4">
                          {p.exclusion ? (
                            <span
                              className="text-xs text-muted-foreground"
                              title={EXCLUSION_COPY[p.exclusion].detail}
                            >
                              {EXCLUSION_COPY[p.exclusion].label}
                            </span>
                          ) : (
                            <Badge
                              variant={badge.variant}
                              className="font-mono text-[10px] uppercase"
                              title={p.verification.reason ?? undefined}
                            >
                              {badge.label}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                          <LocalTime ms={p.timestamp} variant="datetime" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
