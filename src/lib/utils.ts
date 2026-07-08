import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conditional logic, de-duping conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with thousands separators. */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

/** Format a currency value (default USD). */
export function formatCurrency(
  amount: number | null | undefined,
  currency = "USD",
): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/** Convert a country ISO code (e.g. "US") to its flag emoji. */
export function countryFlag(iso?: string | null): string {
  if (!iso || iso.length !== 2) return "🏳️";
  const codePoints = iso
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

/**
 * Format an ISO date string (e.g. a legal page's `lastUpdated` constant) as
 * a long en-AU date — "6 July 2026". Shared by both legal shells so the
 * two brand-distinct surfaces still agree on date formatting.
 */
export function formatLegalDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
