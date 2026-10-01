import type { CompetitionPeriod, CompetitionRecord } from "@/types";

/**
 * Every archived competition winner as one flat, player-centred history, with
 * whether their prize has been dealt with.
 *
 * Pure so the ordering and the win counting are tested.
 */

export type PrizeStatus = "pending" | "contacted" | "sent";

export const PRIZE_STATUSES: { value: PrizeStatus; label: string }[] = [
  { value: "pending", label: "Not contacted" },
  { value: "contacted", label: "Emailed" },
  { value: "sent", label: "Prize sent" },
];

export function isPrizeStatus(v: unknown): v is PrizeStatus {
  return v === "pending" || v === "contacted" || v === "sent";
}

/** Document id for one winner's prize in one competition. */
export const prizeKey = (competitionId: string, uid: string) =>
  `${competitionId}__${uid}`;

export interface WinnerRow {
  key: string;
  competitionId: string;
  competition: string;
  periodType: CompetitionPeriod;
  /** When the competition was closed (epoch ms). */
  resetAt: number;
  /** 1-based finishing position. */
  place: number;
  uid: string;
  displayName: string | null;
  score: number;
  status: PrizeStatus;
}

/** Newest competition first; within a competition, 1st place first. */
export function winnerRows(
  history: CompetitionRecord[],
  statuses: Record<string, PrizeStatus>,
): WinnerRow[] {
  return [...history]
    .sort((a, b) => b.resetAt - a.resetAt)
    .flatMap((comp) =>
      comp.winners.map((w, i) => {
        const key = prizeKey(comp.id, w.uid);
        return {
          key,
          competitionId: comp.id,
          competition: comp.label,
          periodType: comp.periodType,
          resetAt: comp.resetAt,
          // The archive is stored in finishing order; trust that over a rank
          // field older archives may lack.
          place: i + 1,
          uid: w.uid,
          displayName: w.displayName ?? null,
          score: w.score,
          status: statuses[key] ?? "pending",
        } satisfies WinnerRow;
      }),
    );
}

export interface RepeatWinner {
  uid: string;
  displayName: string | null;
  /** Finishes within the top `maxPlace`. */
  podiums: number;
  firsts: number;
}

/** Players ranked by how often they finished in the top `maxPlace`. */
export function repeatWinners(rows: WinnerRow[], maxPlace = 3): RepeatWinner[] {
  const byPlayer = new Map<string, RepeatWinner>();
  // Rows are newest first, so the first name seen is the most recent one.
  for (const r of rows) {
    if (r.place > maxPlace) continue;
    const p = byPlayer.get(r.uid) ?? {
      uid: r.uid,
      displayName: r.displayName,
      podiums: 0,
      firsts: 0,
    };
    p.podiums += 1;
    if (r.place === 1) p.firsts += 1;
    p.displayName ??= r.displayName;
    byPlayer.set(r.uid, p);
  }
  return [...byPlayer.values()].sort(
    (a, b) => b.firsts - a.firsts || b.podiums - a.podiums,
  );
}
