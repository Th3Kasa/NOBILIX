import {
  AlertTriangle,
  BadgeCheck,
  FlaskConical,
  HelpCircle,
  Receipt,
  ShieldQuestion,
  ShoppingCart,
  Smartphone,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTestAccountUids } from "@/lib/trapman/test-accounts";
import { getAppleSales } from "@/lib/trapman/app-store-connect";
import { getPlaySales } from "@/lib/trapman/play-reports";
import { productLabel, platformLabel } from "@/lib/trapman/labels";
import type { PurchaseVerdict } from "@/lib/trapman/play-verify";
import { getPurchasesData, summarise, type ExclusionReason } from "./data";
import {
  TestAccountControls,
  type BuyerSummary,
} from "./test-account-controls";
import { resolveRangeNow } from "./range";
import { RangePicker } from "./range-picker";
import { StoreSalesPanel } from "./store-sales-panel";
import { getAudRates, convertToAud, formatAud, formatOriginal } from "../fx";

export const dynamic = "force-dynamic";

/** Plain-English wording for each reason a record is not counted as a sale. */
const EXCLUSION_COPY: Record<
  ExclusionReason,
  { label: string; detail: string }
> = {
  editor: {
    label: "Made in the Unity Editor",
    detail: "Never reached a store, so no money was ever involved.",
  },
  "test-account": {
    label: "Bought by an internal tester",
    detail: "Accounts you marked as testers in the list below.",
  },
  "store-test": {
    label: "Google Play licence-test purchase",
    detail:
      "Google confirms these were made by a licence tester and were free.",
  },
  promo: {
    label: "Redeemed with a promo code",
    detail: "A real player got the item, but no money changed hands.",
  },
  rewarded: {
    label: "Granted by a rewarded ad",
    detail: "The player earned the item by watching an ad.",
  },
  refunded: {
    label: "Refunded or cancelled",
    detail: "Google reversed the payment after the game recorded it.",
  },
  pending: {
    label: "Payment still pending",
    detail: "Not completed yet — it will count if and when it goes through.",
  },
};

/** How each store verdict is shown on a purchase row. */
const VERDICT_BADGE: Record<
  PurchaseVerdict,
  { label: string; variant: "success" | "secondary" | "destructive" | "outline" }
> = {
  paid: { label: "Paid", variant: "success" },
  test: { label: "Test", variant: "destructive" },
  promo: { label: "Promo", variant: "secondary" },
  rewarded: { label: "Rewarded", variant: "secondary" },
  refunded: { label: "Refunded", variant: "destructive" },
  pending: { label: "Pending", variant: "secondary" },
  unverified: { label: "Unconfirmed", variant: "outline" },
};

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const [data, fx, testUids, session, range, apple, play] = await Promise.all([
    getPurchasesData(),
    getAudRates(),
    getTestAccountUids(),
    auth(),
    searchParams.then(resolveRangeNow),
    getAppleSales(30),
    getPlaySales(),
  ]);
  const canWrite = session?.user?.role !== "viewer";

  const summary = summarise(data.records, range);

  // One row per buyer across every record in the window, including excluded
  // ones — the point of this list is to decide which buyers are internal
  // testing, which you cannot do if the testers are already hidden.
  const buyerMap = new Map<string, BuyerSummary>();
  for (const p of summary.all) {
    const existing = buyerMap.get(p.buyerUid);
    if (existing) {
      existing.purchaseCount += 1;
      existing.editorOnly = existing.editorOnly && p.isEditorPurchase;
      existing.name ??= p.buyerName;
    } else {
      buyerMap.set(p.buyerUid, {
        uid: p.buyerUid,
        name: p.buyerName,
        purchaseCount: 1,
        isTestAccount: testUids.has(p.buyerUid),
        editorOnly: p.isEditorPurchase,
      });
    }
  }
  const buyers = [...buyerMap.values()].sort(
    (a, b) => b.purchaseCount - a.purchaseCount,
  );

  /** AUD display with honest original-currency fallback when FX is down. */
  const aud = (amount: number, currency: string): string => {
    const converted = fx.connected ? convertToAud(amount, currency, fx) : null;
    return converted != null
      ? formatAud(converted)
      : formatOriginal(amount, currency);
  };

  // Total revenue across all currencies, converted to AUD. Convert everything
  // convertible and disclose the remainder rather than discarding the total
  // because one live store currency (IDR, VND, NGN, PKR…) has no rate.
  let totalRevenueAud: number | null = null;
  const unconvertedCurrencies: string[] = [];
  if (fx.connected && summary.revenueByCurrency.length > 0) {
    let total = 0;
    let convertedAny = false;
    for (const { currency, total: amount } of summary.revenueByCurrency) {
      const converted = convertToAud(amount, currency, fx);
      if (converted == null) {
        unconvertedCurrencies.push(currency);
        continue;
      }
      total += converted;
      convertedAny = true;
    }
    if (convertedAny) totalRevenueAud = total;
  }

  const activeExclusions = (
    Object.entries(summary.exclusions) as [ExclusionReason, number][]
  ).filter(([, count]) => count > 0);

  return (
    <>
      <PageHeader
        title="Purchases"
        description="Real sales only — test, promo and refunded purchases are identified and kept out of the totals."
      />

      {/* The stores' own numbers lead the page: they are what was actually
          billed, and they do not depend on the game having saved anything.
          Kept separate from the totals below, which follow the range picker
          rather than each store's 30-day reporting window. */}
      <StoreSalesPanel apple={apple} play={play} fx={fx} />

      {!data.connected ? (
        <Card className="console-empty-state border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="relative flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]" />
            <div>
              <p className="font-medium text-[var(--console-action)]">
                Not connected to the game&apos;s database
              </p>
              <p className="text-muted-foreground">
                {data.error ??
                  "Purchase records will appear once the connection details are added."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : data.records.length === 0 && data.unparsedRecords === 0 ? (
        <div className="console-empty-state console-glass rounded-xl border border-dashed border-border">
          <div className="relative flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--console-violet-tint)] text-[var(--console-violet)]">
              <Receipt className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">No purchase records yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Purchases are read live from{" "}
              <code className="font-mono text-xs">users/&#123;uid&#125;.purchases</code>.
              Revenue, product, and buyer analytics populate here automatically
              as soon as transactions are recorded — nothing to configure.
            </p>
          </div>
        </div>
      ) : (
        <>
          <RangePicker range={range} />

          {/* The presale question: how many people actually paid. */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="People who bought"
              value={summary.buyerCount}
              icon={Users}
              hint={`${range.label} · excludes testers`}
            />
            <StatCard
              label="Real sales"
              value={summary.totalCount}
              icon={ShoppingCart}
              hint={
                summary.excludedTotal > 0
                  ? `${summary.excludedTotal} other record${summary.excludedTotal === 1 ? "" : "s"} excluded`
                  : undefined
              }
            />
            {totalRevenueAud != null ? (
              <StatCard
                label="Revenue (AUD)"
                value={formatAud(totalRevenueAud)}
                icon={Receipt}
                hint={`Converted at today's exchange rate · ${fx.asOf}`}
              />
            ) : (
              <StatCard
                label="Revenue (AUD)"
                value={
                  summary.revenueByCurrency[0]
                    ? formatOriginal(
                        summary.revenueByCurrency[0].total,
                        summary.revenueByCurrency[0].currency,
                      )
                    : formatAud(0)
                }
                icon={Receipt}
                hint={
                  summary.revenueByCurrency[0]
                    ? "Exchange rate unavailable — shown in the original currency"
                    : "No counted sales in this period"
                }
              />
            )}
            <StatCard
              label="Confirmed by the store"
              value={`${summary.storeConfirmedCount} of ${summary.totalCount}`}
              icon={BadgeCheck}
              hint={
                summary.unconfirmedCount > 0
                  ? `${summary.unconfirmedCount} could not be checked`
                  : "Every sale verified with Google Play"
              }
            />
          </div>

          {/* How much of the headline figure is proven, and what is blocking
              the rest. This is the difference between a number and a number
              you can quote to someone. */}
          <Card className="console-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldQuestion
                  className="size-4 text-[var(--console-violet)]"
                  aria-hidden="true"
                />
                How confident are these numbers?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              {!data.verificationConfigured ? (
                <div className="rounded-md border border-[var(--console-action-border)] bg-[var(--console-action-tint)] p-3">
                  <p className="font-medium text-[var(--console-action)]">
                    Google Play checking is not switched on yet
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Until it is, the console cannot tell a paid Android sale
                    apart from a free licence-test purchase on its own — it can
                    only exclude the testers you mark by hand below. To switch
                    it on, invite the console&apos;s service account in Play
                    Console → Users and permissions and give it &ldquo;View
                    financial data&rdquo;.
                  </p>
                </div>
              ) : data.verificationBlockedReason ? (
                <div className="rounded-md border border-[var(--console-action-border)] bg-[var(--console-action-tint)] p-3">
                  <p className="font-medium text-[var(--console-action)]">
                    Google Play could not be asked
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {data.verificationBlockedReason}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Every Android purchase is checked against Google Play, which
                  reports whether it was really paid for, made by a licence
                  tester, redeemed with a promo code, or later refunded.
                </p>
              )}

              {data.appleUnverifiableCount > 0 && (
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <p className="font-medium">
                    {data.appleUnverifiableCount} iPhone purchase
                    {data.appleUnverifiableCount === 1 ? "" : "s"} cannot be
                    checked with Apple
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    The game saves an empty receipt for iOS purchases, so there
                    is nothing to send to Apple. Until the game is changed to
                    store the App Store receipt, the only way to keep an iPhone
                    test purchase out of these figures is to mark the buyer as a
                    tester below.
                  </p>
                </div>
              )}

              {data.verificationCapped && (
                <p className="text-muted-foreground">
                  More purchases needed checking than one refresh allows. The
                  rest are checked on the next refresh.
                </p>
              )}

              {data.scanCapped && (
                <p className="text-muted-foreground">
                  Only the first {data.sampleSize.toLocaleString()} player
                  profiles were scanned, so totals may be incomplete.
                </p>
              )}
            </CardContent>
          </Card>

          {unconvertedCurrencies.length > 0 && (
            <Card className="console-empty-state mb-6 border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
              <CardContent className="relative flex items-start gap-3 p-4 text-sm">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium text-[var(--console-action)]">
                    The AUD total excludes{" "}
                    {unconvertedCurrencies.length === 1
                      ? "one currency"
                      : `${unconvertedCurrencies.length} currencies`}
                  </p>
                  <p className="text-muted-foreground">
                    No exchange rate is available for{" "}
                    {unconvertedCurrencies.join(", ")}. Revenue in{" "}
                    {unconvertedCurrencies.length === 1 ? "it" : "those"} is
                    listed under &ldquo;Revenue by product&rdquo; but is not
                    included in the converted total above.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="console-page-grid mb-6">
            {/* Product breakdown */}
            <Card className="console-glass console-grid-span-6">
              <CardHeader>
                <CardTitle className="text-base">Revenue by product</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {summary.products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No counted sales in this period.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th scope="col" className="py-2 pr-4 font-medium">Product</th>
                          <th scope="col" className="py-2 pr-4 font-medium">Sold</th>
                          <th scope="col" className="py-2 font-medium">Revenue (AUD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.products.map((product) => (
                          <tr
                            key={`${product.productId}-${product.currency}`}
                            className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                          >
                            <td className="py-2.5 pr-4">
                              <div className="font-medium">
                                {productLabel(product.productId)}
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {product.productId}
                              </div>
                            </td>
                            <td className="py-2.5 pr-4 font-mono tabular-nums">
                              {product.count}
                            </td>
                            <td className="py-2.5 font-mono tabular-nums">
                              {aud(product.revenue, product.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {fx.connected && summary.products.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Converted at today&apos;s official exchange rate ({fx.asOf}).
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Platform split + a full account of what was left out */}
            <Card className="console-glass console-grid-span-6">
              <CardHeader>
                <CardTitle className="text-base">
                  Platforms &amp; what was left out
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                {summary.platforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No counted sales in this period.
                  </p>
                ) : (
                  summary.platforms.map((p) => (
                    <div
                      key={p.platform}
                      className="flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <Smartphone
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {platformLabel(p.platform)}
                      </span>
                      <span className="font-mono text-sm tabular-nums">
                        {p.count} sale{p.count === 1 ? "" : "s"}
                      </span>
                    </div>
                  ))
                )}

                {(activeExclusions.length > 0 || data.unparsedRecords > 0) && (
                  <div className="mt-2 space-y-2 border-t border-border/60 pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Not counted as sales
                    </p>
                    <ul className="space-y-2">
                      {activeExclusions.map(([reason, count]) => (
                        <li key={reason} className="text-xs">
                          <span className="font-mono tabular-nums text-foreground">
                            {count}
                          </span>{" "}
                          <span className="text-foreground">
                            {EXCLUSION_COPY[reason].label}
                          </span>
                          <span className="block text-muted-foreground">
                            {EXCLUSION_COPY[reason].detail}
                          </span>
                        </li>
                      ))}
                      {data.unparsedRecords > 0 && (
                        <li className="text-xs">
                          <span className="font-mono tabular-nums text-foreground">
                            {data.unparsedRecords}
                          </span>{" "}
                          <span className="text-foreground">
                            Unreadable record
                            {data.unparsedRecords === 1 ? "" : "s"}
                          </span>
                          <span className="block text-muted-foreground">
                            Stored in a shape the console does not recognise, so
                            they are excluded from every figure above.
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Test-account register */}
          {canWrite && buyers.length > 0 && (
            <Card className="console-glass mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FlaskConical
                    className="size-4 text-[var(--console-violet)]"
                    aria-hidden="true"
                  />
                  Buyers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="mb-2 text-sm text-muted-foreground">
                  Marking a buyer as a test account removes their purchases from
                  every revenue figure. Nothing is deleted from the game&apos;s
                  data and the change can be undone at any time. Use this for
                  iPhone testers — Apple purchases cannot be detected
                  automatically.
                </p>
                <TestAccountControls buyers={buyers} />
              </CardContent>
            </Card>
          )}

          {/* Every record in the window, counted or not */}
          <Card className="console-glass">
            <CardHeader>
              <CardTitle className="text-base">
                Purchase records · {range.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {summary.all.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No purchases recorded in this period.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th scope="col" className="py-2 pr-4 font-medium">Product</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Price (AUD)</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Platform</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Buyer</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Counted?</th>
                        <th scope="col" className="py-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.all.slice(0, 50).map((p) => {
                        const badge = VERDICT_BADGE[p.verification.verdict];
                        return (
                          <tr
                            key={`${p.buyerUid}-${p.purchaseId}`}
                            className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                          >
                            <td className="py-2.5 pr-4">
                              <div className="font-medium">
                                {productLabel(p.productId)}
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {p.productId}
                              </div>
                            </td>
                            <td className="py-2.5 pr-4 font-mono tabular-nums">
                              {aud(p.price, p.currency)}
                              <span className="ml-1.5 text-[11px] text-muted-foreground">
                                {formatOriginal(p.price, p.currency)}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-xs">
                              {platformLabel(p.platform)}
                            </td>
                            <td className="py-2.5 pr-4">{p.buyerName ?? "—"}</td>
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
                              {format(new Date(p.timestamp), "PP p")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {summary.all.length > 50 && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HelpCircle className="size-3.5" aria-hidden="true" />
                  Showing the 50 most recent of {summary.all.length}. Export the
                  CSV for the full list.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
