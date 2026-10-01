import { Info, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { countryFlag } from "@/lib/utils";
import { productLabel } from "@/lib/trapman/labels";
import type { AppleSalesData } from "@/lib/trapman/app-store-connect";

/**
 * Apple's own account of iOS sales, shown next to the console's Firestore-
 * derived figures.
 *
 * These two numbers answer subtly different questions and are meant to be
 * compared, not merged. The figures above this panel are what the *game*
 * recorded; this panel is what Apple actually billed for — already net of
 * refunds, and with sandbox and TestFlight purchases never included. When they
 * disagree, the gap is the interesting part: it means the game is dropping
 * purchases, or recording ones that never completed.
 */
export function StoreSalesPanel({ apple }: { apple: AppleSalesData }) {
  if (!apple.configured) {
    return (
      <Card className="console-glass mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store
              className="size-4 text-[var(--console-violet)]"
              aria-hidden="true"
            />
            Sales direct from the App Store
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="font-medium">Not connected yet</p>
            <p className="mt-1 text-muted-foreground">
              Apple can report exactly how many iPhone sales there really were,
              net of refunds and with test purchases already excluded — which is
              the only way to get trustworthy iOS numbers, since the game
              doesn&apos;t save a usable receipt. It needs an App Store Connect
              API key with the Sales role, plus your vendor number.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const s = apple.summary;

  return (
    <Card className="console-glass mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Store
            className="size-4 text-[var(--console-violet)]"
            aria-hidden="true"
          />
          Sales direct from the App Store
          {apple.latestReportDate && (
            <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
              through {apple.latestReportDate}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 text-sm">
        {apple.error && (
          <div className="rounded-md border border-[var(--console-action-border)] bg-[var(--console-action-tint)] p-3">
            <p className="font-medium text-[var(--console-action)]">
              Apple couldn&apos;t be fully read
            </p>
            <p className="mt-1 text-muted-foreground">{apple.error}</p>
          </div>
        )}

        {!s || (s.appUnits === 0 && s.iapUnits === 0) ? (
          <p className="text-muted-foreground">
            Apple has published no iOS sales for this period.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  App downloads
                </p>
                <p className="font-mono text-2xl tabular-nums">
                  {s.appUnits.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  In-app purchases
                </p>
                <p className="font-mono text-2xl tabular-nums">
                  {s.iapUnits.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Your earnings
                </p>
                <p className="font-mono text-2xl tabular-nums">
                  {s.proceedsByCurrency.length === 0
                    ? "—"
                    : s.proceedsByCurrency
                        .map(
                          (p) =>
                            `${p.total.toFixed(2)} ${p.currency}`,
                        )
                        .join(" · ")}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Refunded
                </p>
                <p className="font-mono text-2xl tabular-nums">
                  {s.refundedUnits.toLocaleString()}
                </p>
              </div>
            </div>

            {s.products.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th scope="col" className="py-2 pr-4 font-medium">Product</th>
                      <th scope="col" className="py-2 pr-4 font-medium">Units</th>
                      <th scope="col" className="py-2 font-medium">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.products.map((p) => (
                      <tr
                        key={`${p.sku}-${p.currency}`}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="py-2 pr-4">
                          <span className="font-medium">
                            {productLabel(p.sku)}
                          </span>
                          <Badge
                            variant="outline"
                            className="ml-2 text-[10px] uppercase"
                          >
                            {p.kind === "iap" ? "In-app" : "App"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 font-mono tabular-nums">
                          {p.units.toLocaleString()}
                        </td>
                        <td className="py-2 font-mono tabular-nums">
                          {p.proceeds.toFixed(2)} {p.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {s.countries.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {s.countries.slice(0, 10).map((c) => (
                  <span key={c.countryCode}>
                    {countryFlag(c.countryCode)} {c.countryCode}{" "}
                    <span className="font-mono tabular-nums">{c.units}</span>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        <p className="flex items-start gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Apple publishes each day&apos;s report about a day later, so this
            lags the figures above — but it excludes sandbox and TestFlight
            purchases and is already net of refunds. Where the two disagree,
            trust this one for money and the list above for who bought.
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

