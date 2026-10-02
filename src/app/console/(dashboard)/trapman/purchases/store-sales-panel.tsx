import type { ReactNode } from "react";
import { Info, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { countryFlag } from "@/lib/utils";
import { productLabel } from "@/lib/trapman/labels";
import type { AppleSalesData } from "@/lib/trapman/app-store-connect";
import type { PlaySalesData } from "@/lib/trapman/play-reports";
import type { StoreSalesSummary } from "@/lib/trapman/store-reports";
import {
  convertToAud,
  formatAud,
  formatAudTotal,
  formatOriginal,
  sumInAud,
  type FxRates,
} from "../fx";

/**
 * Each store's own account of what sold, next to the console's Firestore-
 * derived figures.
 *
 * The figures elsewhere on this page are what the *game* recorded; these are
 * what Apple and Google actually billed — test purchases never included,
 * refunds already accounted for. When the two disagree, trust these for money
 * and the game's records for who bought.
 */

/** A multi-currency amount in AUD, by the console-wide rule (fx.sumInAud). */
function Money({
  amounts,
  fx,
}: {
  amounts: { currency: string; total: number }[];
  fx: FxRates;
}) {
  if (amounts.length === 0) return <>—</>;
  return <>{formatAudTotal(sumInAud(amounts, fx))}</>;
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-2xl tabular-nums">{children}</p>
    </div>
  );
}

function StoreCard({
  title,
  badge,
  children,
  note,
}: {
  title: string;
  badge?: string | null;
  children: ReactNode;
  note: string;
}) {
  return (
    <Card className="console-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Store
            className="size-4 text-[var(--console-violet)]"
            aria-hidden="true"
          />
          {title}
          {badge && (
            <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
              {badge}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 text-sm">
        {children}
        <p className="flex items-start gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{note}</span>
        </p>
      </CardContent>
    </Card>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--console-action-border)] bg-[var(--console-action-tint)] p-3">
      <p className="font-medium text-[var(--console-action)]">{title}</p>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </div>
  );
}

function NotConnected({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="font-medium">Not connected yet</p>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </div>
  );
}

function ProductsTable({
  summary,
  fx,
  moneyLabel,
}: {
  summary: StoreSalesSummary;
  fx: FxRates;
  moneyLabel: string;
}) {
  if (summary.products.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="py-2 pr-4 font-medium">Product</th>
            <th scope="col" className="py-2 pr-4 font-medium">Units</th>
            <th scope="col" className="py-2 font-medium">{moneyLabel}</th>
          </tr>
        </thead>
        <tbody>
          {summary.products.map((p) => {
            const aud = fx.connected ? convertToAud(p.proceeds, p.currency, fx) : null;
            return (
              <tr
                key={`${p.sku}-${p.currency}`}
                className="border-b border-border/60 last:border-0"
              >
                <td className="py-2 pr-4">
                  <span className="font-medium">{productLabel(p.sku)}</span>
                  <Badge variant="outline" className="ml-2 text-[10px] uppercase">
                    {p.kind === "iap" ? "In-app" : "App"}
                  </Badge>
                </td>
                <td className="py-2 pr-4 font-mono tabular-nums">
                  {p.units.toLocaleString()}
                </td>
                <td className="py-2 font-mono tabular-nums">
                  {aud !== null ? formatAud(aud) : formatOriginal(p.proceeds, p.currency)}
                  {aud !== null && p.currency !== "AUD" && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatOriginal(p.proceeds, p.currency)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Countries({ summary }: { summary: StoreSalesSummary }) {
  if (summary.countries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {summary.countries.slice(0, 10).map((c) => (
        <span key={c.countryCode}>
          {countryFlag(c.countryCode)} {c.countryCode}{" "}
          <span className="font-mono tabular-nums">{c.units}</span>
        </span>
      ))}
    </div>
  );
}

function monthLabel(yyyymm: string): string {
  const d = new Date(Date.UTC(Number(yyyymm.slice(0, 4)), Number(yyyymm.slice(4)) - 1, 1));
  return d.toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });
}

function ApplePanel({ apple, fx }: { apple: AppleSalesData; fx: FxRates }) {
  const s = apple.summary;
  return (
    <StoreCard
      title="App Store (iPhone)"
      badge={apple.latestReportDate ? `through ${apple.latestReportDate}` : null}
      note="Last 30 days, from Apple's daily sales reports (about a day behind). Earnings are after Apple's commission and already net of refunds; sandbox and TestFlight purchases are never included."
    >
      {!apple.configured ? (
        <NotConnected>
          Needs an App Store Connect API key with the Sales role (Issuer ID,
          Key ID and the .p8 key) plus the vendor number.
        </NotConnected>
      ) : (
        <>
          {apple.error && <Notice title="Apple couldn't be fully read">{apple.error}</Notice>}
          {!s || (s.appUnits === 0 && s.iapUnits === 0 && s.refundedUnits === 0) ? (
            <p className="text-muted-foreground">
              Apple has published no iPhone sales or downloads for this period.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Tile label="Downloads">{s.appUnits.toLocaleString()}</Tile>
                <Tile label="In-app purchases">{s.iapUnits.toLocaleString()}</Tile>
                <Tile label="Your earnings">
                  <Money amounts={s.proceedsByCurrency} fx={fx} />
                </Tile>
                <Tile label="Refunded">{s.refundedUnits.toLocaleString()}</Tile>
              </div>
              <ProductsTable summary={s} fx={fx} moneyLabel="Earnings" />
              <Countries summary={s} />
            </>
          )}
        </>
      )}
    </StoreCard>
  );
}

function PlayPanel({ play, fx }: { play: PlaySalesData; fx: FxRates }) {
  const s = play.sales;
  const latest = [play.latestSaleDate, play.installs?.latestDate]
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  return (
    <StoreCard
      title="Google Play (Android)"
      badge={latest ? `through ${latest}` : null}
      note="Downloads and sales cover the last 30 days and run 2–7 days behind. Sales are what buyers paid, before Google's fee and tax; payouts are what Google actually pays, published once each month closes."
    >
      {!play.configured ? (
        <NotConnected>
          Needs the Play reports bucket (PLAY_REPORTS_BUCKET) and the
          console&apos;s service account invited in Play Console with access to
          bulk reports and financial data.
        </NotConnected>
      ) : (
        <>
          {play.error && <Notice title="Google Play couldn't be fully read">{play.error}</Notice>}
          {play.unreadableFiles.length > 0 && (
            <Notice title="Some report files weren't recognised">
              Google may have changed their layout:{" "}
              {play.unreadableFiles.join(", ")}
            </Notice>
          )}
          {play.connected && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Tile label="New installs">
                  {play.installs ? play.installs.newUsers.toLocaleString() : "—"}
                </Tile>
                <Tile label="In-app purchases">
                  {s ? s.iapUnits.toLocaleString() : "0"}
                </Tile>
                <Tile label="Sales (before fees)">
                  {s ? <Money amounts={s.proceedsByCurrency} fx={fx} /> : formatAud(0)}
                </Tile>
                <Tile label="Refunded">{s ? s.refundedUnits.toLocaleString() : "0"}</Tile>
              </div>

              {play.installs && (
                <p className="text-xs text-muted-foreground">
                  {play.installs.uninstalls.toLocaleString()} uninstalls in the
                  same period
                  {play.installs.activeDevices
                    ? ` · installed on ${play.installs.activeDevices.toLocaleString()} devices as of ${play.installs.latestDate}`
                    : ""}
                  .
                </p>
              )}

              {s && s.appUnits > 0 && (
                <p className="text-xs text-muted-foreground">
                  Includes {s.appUnits.toLocaleString()} paid download
                  {s.appUnits === 1 ? "" : "s"}.
                </p>
              )}

              {s && <ProductsTable summary={s} fx={fx} moneyLabel="Sales" />}
              {s && <Countries summary={s} />}

              {play.earnings.length > 0 && (
                <div className="space-y-1 rounded-md border border-border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Paid out by Google (after fee and tax)
                  </p>
                  {play.earnings.map((e) => {
                    const net = convertToAud(e.net, e.currency, fx);
                    return (
                      <p key={e.month} className="flex justify-between gap-4">
                        <span>{monthLabel(e.month)}</span>
                        <span className="font-mono tabular-nums">
                          {net !== null ? formatAud(net) : formatOriginal(e.net, e.currency)}
                        </span>
                      </p>
                    );
                  })}
                </div>
              )}

              {play.backfilling && !play.error && (
                <p className="text-xs text-muted-foreground">
                  Still loading older report files — the rest arrive on the
                  next refresh.
                </p>
              )}
            </>
          )}
        </>
      )}
    </StoreCard>
  );
}

export function StoreSalesPanel({
  apple,
  play,
  fx,
}: {
  apple: AppleSalesData;
  play: PlaySalesData;
  fx: FxRates;
}) {
  return (
    <div className="mb-6 grid gap-4 xl:grid-cols-2">
      <ApplePanel apple={apple} fx={fx} />
      <PlayPanel play={play} fx={fx} />
    </div>
  );
}
