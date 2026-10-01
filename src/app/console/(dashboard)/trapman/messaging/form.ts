import { z } from "zod";
import type { CampaignAudience } from "@/types";

/**
 * The compose form's rules, kept free of server imports so they can be tested.
 *
 * An empty number box submits "", and `z.coerce.number()` turns "" into 0 — so
 * leaving "Max level" blank meant "max level 0" and leaving "Active within"
 * blank meant "active in the last 0 days". Either one silently shrank a segment
 * to nobody. Blank boxes are read as "no filter" instead.
 */
const optionalWholeNumber = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.coerce
    .number()
    .int("Use whole numbers for level and days.")
    .min(0, "Level and days can't be negative.")
    .optional(),
);

export const composeSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  body: z.string().min(1, "Message is required").max(1000),
  audienceType: z.enum(["single", "segment", "broadcast"]),
  uid: z.string().optional(),
  country: z.string().max(2).optional(),
  minLevel: optionalWholeNumber,
  maxLevel: optionalWholeNumber,
  lastActiveDays: optionalWholeNumber,
});

export type ComposeInput = z.infer<typeof composeSchema>;

export function buildAudience(d: ComposeInput): CampaignAudience | null {
  if (d.audienceType === "single") {
    const uid = d.uid?.trim();
    if (!uid) return null;
    return { type: "single", uid };
  }
  if (d.audienceType === "broadcast") return { type: "broadcast" };
  return {
    type: "segment",
    filters: {
      country: d.country?.trim() || undefined,
      minLevel: d.minLevel,
      maxLevel: d.maxLevel,
      lastActiveDays: d.lastActiveDays,
    },
  };
}
