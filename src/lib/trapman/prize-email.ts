/**
 * The prize email an operator sends to a competition winner.
 *
 * Sent from the operator's own email app via a mailto: link rather than from
 * the server: there is no email provider to set up, the operator reviews every
 * word before it goes, and replies land in a real inbox they already read.
 *
 * Pure so the wording and the link encoding are tested.
 */

export interface PrizeEmailInput {
  displayName?: string | null;
  /** Position on the board; null when unknown. */
  rank?: number | null;
  score: number;
  /** The archived competition's name, or null for the live board. */
  competition: string | null;
}

const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
};

export function buildPrizeEmail(input: PrizeEmailInput): {
  subject: string;
  body: string;
} {
  const name = input.displayName?.trim() || "there";
  const where = input.competition ? `in ${input.competition}` : "on the Trap-Man leaderboard";
  const score = input.score.toLocaleString("en-AU");
  const place = input.rank && input.rank > 0 ? ordinal(input.rank) : null;

  return {
    subject: input.competition
      ? place
        ? `You placed ${place} in ${input.competition} — your Trap-Man prize`
        : `Your ${input.competition} prize from Trap-Man`
      : place
        ? `You're ${place} on the Trap-Man leaderboard — your prize`
        : "Your Trap-Man leaderboard prize",
    body: [
      `Hi ${name},`,
      "",
      place
        ? `Congratulations! You finished ${place} ${where} with a score of ${score}.`
        : `Congratulations! You scored ${score} ${where}.`,
      "",
      "You've won a prize. To claim it, just reply to this email with:",
      "- your full name",
      "- the best way to get your prize to you",
      "",
      "We'll be in touch within a few days.",
      "",
      "Thanks for playing,",
      "The Trap-Man team",
    ].join("\n"),
  };
}

/** A mailto: link that opens the operator's email app with everything filled in. */
export function mailtoLink(to: string, subject: string, body: string): string {
  // encodeURIComponent, not URLSearchParams: mail apps read "+" literally, so
  // spaces must be %20, and newlines must survive as %0A.
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
