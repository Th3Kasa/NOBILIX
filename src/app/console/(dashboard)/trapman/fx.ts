import "server-only";

/**
 * Live AUD currency conversion for the TrapMan console.
 *
 * All money shown in the CRM is presented in AUD, converted at the live
 * European Central Bank reference rate (via the free, keyless Frankfurter
 * API). Rates are cached for an hour via Next's fetch cache. If the FX
 * service is unreachable, callers fall back to displaying the original
 * currency — never a guessed or stale-labelled-as-live number.
 */

const FX_ENDPOINT = "https://api.frankfurter.dev/v1/latest?base=AUD";

export interface FxRates {
  connected: boolean;
  /** Value of 1 AUD expressed in each currency, e.g. { USD: 0.689, INR: 65.6 } */
  audTo: Record<string, number>;
  /** ECB reference date the rates were published for */
  asOf?: string;
  error?: string;
}

export async function getAudRates(): Promise<FxRates> {
  try {
    const res = await fetch(FX_ENDPOINT, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`FX service responded ${res.status}`);
    const data = (await res.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    if (!data.rates) throw new Error("FX service returned no rates");
    return {
      connected: true,
      audTo: { ...data.rates, AUD: 1 },
      asOf: data.date,
    };
  } catch (err) {
    return {
      connected: false,
      audTo: {},
      error: err instanceof Error ? err.message : "Unknown FX error",
    };
  }
}

/** Convert an amount in `currency` to AUD, or null if the rate is unknown. */
export function convertToAud(
  amount: number,
  currency: string,
  fx: FxRates,
): number | null {
  const code = currency.toUpperCase();
  if (code === "AUD") return amount;
  const rate = fx.audTo[code];
  if (!rate || rate <= 0) return null;
  return amount / rate;
}

export function formatAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

/** Format an amount in its original currency for secondary/fallback display. */
export function formatOriginal(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export interface AudTotal {
  /** Everything that could be converted, in AUD. */
  aud: number;
  /** Amounts with no published rate, left in their own currency. */
  unconverted: { currency: string; total: number }[];
}

/**
 * Add up amounts in several currencies as one AUD figure.
 *
 * The single rule every money figure in the console uses: convert what has a
 * rate, and return what doesn't separately so the page can show it beside the
 * total — never drop it, and never present one currency under an AUD label.
 */
export function sumInAud(
  amounts: { currency: string; total: number }[],
  fx: FxRates,
): AudTotal {
  let aud = 0;
  const unconverted: { currency: string; total: number }[] = [];
  for (const { currency, total } of amounts) {
    const converted = fx.connected ? convertToAud(total, currency, fx) : null;
    if (converted === null) unconverted.push({ currency, total });
    else aud += converted;
  }
  return { aud, unconverted };
}

/** "A$12.50", or "A$12.50 + €3.00" when some currencies had no rate. */
export function formatAudTotal(total: AudTotal): string {
  const parts = [formatAud(total.aud)];
  for (const u of total.unconverted) parts.push(formatOriginal(u.total, u.currency));
  return total.unconverted.length > 0 && total.aud === 0
    ? parts.slice(1).join(" + ")
    : parts.join(" + ");
}
