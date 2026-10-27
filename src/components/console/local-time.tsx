"use client";

import { useEffect, useState } from "react";

/**
 * A moment in time, shown in the viewer's own timezone.
 *
 * The console renders on Vercel, whose clock is UTC, so a server-formatted
 * time is hours off for anyone in Australia. The server renders a UTC
 * fallback; the browser swaps in local time once it hydrates.
 */

type Variant = "weekday" | "datetime" | "seconds" | "date";

const FORMATS: Record<Variant, Intl.DateTimeFormatOptions> = {
  /** "Tue 28 Oct, 4:00 am" — for times near now. */
  weekday: { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" },
  /** "28 Oct 2026, 4:00 am" */
  datetime: { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" },
  /** "28 Oct, 4:00:12 am" — the audit log. */
  seconds: { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit" },
  /** "28 Oct 2026" */
  date: { day: "numeric", month: "short", year: "numeric" },
};

function formatLocal(ms: number, variant: Variant): string {
  return new Intl.DateTimeFormat(undefined, FORMATS[variant]).format(ms);
}

function relative(ms: number, now: number): string {
  const mins = Math.round((ms - now) / 60_000);
  const abs = Math.abs(mins);
  const span =
    abs < 1 ? "now" : abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} days`;
  if (span === "now") return "just now";
  return mins > 0 ? `in ${span}` : `${span} ago`;
}

export function LocalTime({
  ms,
  variant = "weekday",
  withRelative = false,
}: {
  ms: number;
  variant?: Variant;
  withRelative?: boolean;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const local = formatLocal(ms, variant);
      setText(withRelative ? `${local} (${relative(ms, Date.now())})` : local);
    };
    update();
    // Only a relative label ("in 5 h") goes stale while the page sits open.
    if (!withRelative) return;
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [ms, variant, withRelative]);

  return (
    <time dateTime={new Date(ms).toISOString()} suppressHydrationWarning>
      {text ?? `${new Date(ms).toISOString().slice(0, 16).replace("T", " ")} UTC`}
    </time>
  );
}
