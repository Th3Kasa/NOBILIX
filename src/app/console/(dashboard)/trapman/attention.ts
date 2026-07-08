import "server-only";
import { getRecentCampaigns } from "@/lib/campaigns";
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

  const [purchasesResult, campaignsResult] = await Promise.allSettled([
    getPurchasesData(),
    getRecentCampaigns(25),
  ]);

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

  if (campaignsResult.status === "fulfilled") {
    const failed = campaignsResult.value.filter((c) => c.failureCount > 0);
    const shown = failed.slice(0, 3);
    for (const campaign of shown) {
      items.push({
        id: `campaign-failed-${campaign.id}`,
        label: `Push "${campaign.title}" failed for ${campaign.failureCount} device${campaign.failureCount === 1 ? "" : "s"}`,
        description: `${campaign.successCount} delivered successfully.`,
        severity: "warning",
        href: "/console/trapman/messaging",
      });
    }
    if (failed.length > shown.length) {
      items.push({
        id: "campaigns-failed-more",
        label: `${failed.length - shown.length} more push campaign${failed.length - shown.length === 1 ? "" : "s"} had failures`,
        severity: "warning",
        href: "/console/trapman/messaging",
      });
    }
  }

  return items;
}
