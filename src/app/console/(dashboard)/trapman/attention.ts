import "server-only";
import { getPurchasesData } from "./purchases/data";
import type { TrapManOverview } from "@/lib/trapman/overview";
import type { Ga4Snapshot } from "./ga4-data";
import type { FxRates } from "./fx";

export interface AttentionItem {
  id: string;
  label: string;
  description?: string;
  severity?: "warning" | "info";
  href?: string;
}

/**
 * Builds the overview's "needs attention" queue from signals that already
 * exist elsewhere on the console — never invented. Each source is read
 * independently so one failing fetch doesn't hide the others' warnings.
 */
export async function getAttentionItems(
  overview: TrapManOverview,
  ga4: Ga4Snapshot,
  fx: FxRates,
): Promise<AttentionItem[]> {
  const items: AttentionItem[] = [];

  if (!overview.connected) {
    items.push({
      id: "firestore-disconnected",
      label: "Not connected to the game's database",
      description: "Player counts and store purchases can't load right now.",
      severity: "warning",
    });
  }

  if (!ga4.connected) {
    items.push({
      id: "ga4-disconnected",
      label: "Google Analytics isn't connected",
      description: ga4.error ?? "Active-player and revenue trends can't load right now.",
      severity: "info",
      href: "/console/trapman/analytics",
    });
  }

  if (!fx.connected) {
    items.push({
      id: "fx-disconnected",
      label: "Revenue conversion unavailable",
      description: fx.error ?? "Store revenue is shown in its original currency only.",
      severity: "info",
      href: "/console/trapman/purchases",
    });
  }

  const [purchasesResult] = await Promise.allSettled([getPurchasesData()]);

  if (purchasesResult.status === "fulfilled" && purchasesResult.value.unparsedRecords > 0) {
    const { unparsedRecords } = purchasesResult.value;
    items.push({
      id: "purchases-unparsed",
      label: `${unparsedRecords} store-receipt record${unparsedRecords === 1 ? "" : "s"} couldn't be parsed`,
      description: "They're in an unrecognised shape and are excluded from purchase totals.",
      severity: "info",
      href: "/console/trapman/purchases",
    });
  }

  // Revenue that nobody has checked with the store is the kind of problem that
  // stays quiet until someone quotes the number out loud, so it belongs here.
  if (purchasesResult.status === "fulfilled") {
    const purchases = purchasesResult.value;
    if (purchases.connected && !purchases.verificationConfigured) {
      items.push({
        id: "purchases-unverified",
        label: "Purchases aren't being checked with Google Play",
        description:
          "Free licence-test purchases look identical to real sales until the store confirms them. Revenue may be overstated.",
        severity: "warning",
        href: "/console/trapman/purchases",
      });
    } else if (purchases.connected && purchases.verificationBlockedReason) {
      items.push({
        id: "purchases-verification-blocked",
        label: "Google Play couldn't confirm any purchases",
        description: purchases.verificationBlockedReason,
        severity: "warning",
        href: "/console/trapman/purchases",
      });
    }
  }

  return items;
}
