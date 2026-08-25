import {
  AlertTriangle,
  FlaskConical,
  Receipt,
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
import { getPurchasesData } from "./data";
import {
  TestAccountControls,
  type BuyerSummary,
} from "./test-account-controls";
import { getAudRates, convertToAud, formatAud, formatOriginal } from "../fx";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const [data, fx, testUids, session] = await Promise.all([
    getPurchasesData(),
    getAudRates(),
    getTestAccountUids(),
    auth(),
  ]);
  const canWrite = session?.user?.role !== "viewer";

  // One row per buyer across every record, including excluded ones — the point
  // of this list is to decide which buyers are internal testing.
  const buyerMap = new Map<string, BuyerSummary>();
  for (const p of data.allPurchases) {
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

  // Total revenue across all currencies, converted to AUD. Previously this was
  // all-or-nothing: a single currency the FX service doesn't carry (IDR, VND,
  // NGN, PKR… all live store currencies) discarded the entire total and the
  // card silently fell back to showing one currency's subtotal under an "AUD"
  // label. Now we convert everything convertible and disclose the remainder.
  let totalRevenueAud: number | null = null;
  const unconvertedCurrencies: string[] = [];
  if (fx.connected && data.revenueByCurrency.length > 0) {
    let total = 0;
    let convertedAny = false;
    for (const { currency, total: amount } of data.revenueByCurrency) {
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

  const excludedCount = data.testAccountRecords + data.editorRecords;

  return (
    <>
      <PageHeader
        title="Purchases"
        description="Live in-app purchase records read from player profiles."
      />

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
      ) : data.allPurchases.length === 0 && data.unparsedRecords === 0 ? (
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
          {/* Revenue + volume metrics */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total purchases"
              value={data.totalCount}
              icon={ShoppingCart}
            />
            <StatCard
              label="Unique buyers"
              value={data.buyerCount}
              icon={Users}
              hint={`of ${data.sampleSize} sampled players`}
            />
            {totalRevenueAud != null ? (
              <StatCard
                label="Revenue (AUD)"
                value={formatAud(totalRevenueAud)}
                icon={Receipt}
                hint={`Converted at today's exchange rate · ${fx.asOf}`}
              />
            ) : (
              data.revenueByCurrency.slice(0, 1).map((rev) => (
                <StatCard
                  key={rev.currency}
                  label={`Revenue (${rev.currency})`}
                  value={formatOriginal(rev.total, rev.currency)}
                  icon={Receipt}
                  hint="Exchange rate unavailable — shown in the original currency"
                />
              ))
            )}
            <StatCard
              label="Avg per purchase"
              value={
                totalRevenueAud != null && data.totalCount > 0
                  ? formatAud(totalRevenueAud / data.totalCount)
                  : null
              }
              icon={Receipt}
              hint="AUD"
            />
          </div>

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
                      {data.products.map((product) => (
                        <tr
                          key={`${product.productId}-${product.currency}`}
                          className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                        >
                          <td className="py-2.5 pr-4 font-mono text-xs">
                            {product.productId}
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
                {fx.connected && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Converted at today&apos;s official exchange rate ({fx.asOf}).
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Platform split */}
            <Card className="console-glass console-grid-span-6">
              <CardHeader>
                <CardTitle className="text-base">Platforms</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                {data.platforms.map((p) => (
                  <div key={p.platform} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm capitalize">
                      <Smartphone
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {p.platform}
                    </span>
                    <span className="font-mono text-sm tabular-nums">
                      {p.count} purchase{p.count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
                {(excludedCount > 0 ||
                  data.unparsedRecords > 0 ||
                  data.unacknowledgedRecords > 0) && (
                  <div className="mt-2 space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    {data.editorRecords > 0 && (
                      <p>
                        {data.editorRecords} purchase
                        {data.editorRecords === 1 ? "" : "s"} made in the Unity
                        Editor {data.editorRecords === 1 ? "is" : "are"} excluded
                        — they never reached a store.
                      </p>
                    )}
                    {data.testAccountRecords > 0 && (
                      <p>
                        {data.testAccountRecords} purchase
                        {data.testAccountRecords === 1 ? "" : "s"} from accounts
                        marked as internal testers are excluded from revenue.
                      </p>
                    )}
                    {data.unparsedRecords > 0 && (
                      <p>
                        {data.unparsedRecords} record
                        {data.unparsedRecords === 1 ? "" : "s"} could not be read
                        and {data.unparsedRecords === 1 ? "is" : "are"} excluded
                        from every figure above.
                      </p>
                    )}
                    {data.unacknowledgedRecords > 0 && (
                      <p>
                        {data.unacknowledgedRecords} Google Play receipt
                        {data.unacknowledgedRecords === 1 ? " was" : "s were"}{" "}
                        stored before acknowledgement. That is normal — receipts
                        are captured at purchase time — but Google revokes a
                        purchase left unacknowledged for three days, so confirm
                        in Play Console if a sale ever looks missing.
                      </p>
                    )}
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
                  data and the change can be undone at any time.
                </p>
                <TestAccountControls buyers={buyers} />
              </CardContent>
            </Card>
          )}

          {/* Recent purchases */}
          <Card className="console-glass">
            <CardHeader>
              <CardTitle className="text-base">Recent purchases</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th scope="col" className="py-2 pr-4 font-medium">Product</th>
                      <th scope="col" className="py-2 pr-4 font-medium">Price (AUD)</th>
                      <th scope="col" className="py-2 pr-4 font-medium">Platform</th>
                      <th scope="col" className="py-2 pr-4 font-medium">Buyer</th>
                      <th scope="col" className="py-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.purchases.slice(0, 25).map((p) => (
                      <tr
                        key={p.purchaseId}
                        className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                      >
                        <td className="py-2.5 pr-4 font-mono text-xs">{p.productId}</td>
                        <td className="py-2.5 pr-4 font-mono tabular-nums">
                          {aud(p.price, p.currency)}
                          <span className="ml-1.5 text-[11px] text-muted-foreground">
                            {formatOriginal(p.price, p.currency)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                            {p.platform}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4">{p.buyerName ?? "—"}</td>
                        <td className="py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                          {format(new Date(p.timestamp), "PP p")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
