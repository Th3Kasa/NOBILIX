import type { PurchaseVerdict } from "@/lib/trapman/play-verify";
import type { ExclusionReason } from "@/lib/trapman/purchase-accounting";

/**
 * How a purchase's status is worded across the console — the Purchases page
 * and each player's profile — so the two can never describe the same record
 * differently. Client-safe: plain data only.
 */

/** Plain-English wording for each reason a record is not counted as a sale. */
export const EXCLUSION_COPY: Record<
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
  "marked-test": {
    label: "Marked as a test purchase",
    detail: "Purchases you marked as tests with \"Mark all as tests\". Undo puts them back.",
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
export const VERDICT_BADGE: Record<
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
