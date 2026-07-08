"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { countryFlag } from "@/lib/utils";
import { ChartTooltip } from "@/components/console/chart-tooltip";
import type { CountrySlice, LevelBucket } from "./data";

const PIE_COLORS = [
  "var(--console-live)",
  "var(--neon-violet)",
  "var(--console-action)",
  "#39e9ff",
  "#ffd436",
  "#f144ff",
  "#5c7cff",
  "#ff9f5c",
];

export function CountryDistributionChart({
  countries,
}: {
  countries: CountrySlice[];
}) {
  if (countries.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No country data available yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-56 w-full sm:w-56 sm:shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={countries}
              dataKey="count"
              nameKey="country"
              innerRadius={48}
              outerRadius={78}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {countries.map((entry, i) => (
                <Cell key={entry.country} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5" role="list">
        {countries.map((c, i) => (
          <li key={c.country} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              aria-hidden="true"
            />
            <span className="flex-1">
              {countryFlag(c.country)} {c.country}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {c.count.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LevelDistributionChart({
  levelBuckets,
}: {
  levelBuckets: LevelBucket[];
}) {
  if (levelBuckets.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No level progress data available yet.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={levelBuckets} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="bucket"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--accent)" }} />
          <Bar
            dataKey="count"
            fill="var(--neon-violet)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
