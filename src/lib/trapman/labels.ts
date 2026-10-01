/**
 * One vocabulary for every machine name the console displays.
 *
 * Raw identifiers come from three systems that each name things their own way:
 * Google Analytics events (`user_engagement`, `session_end`), store product
 * ids (`com.cultshotta.trapman.hearts_tier_1`) and Unity runtime platforms
 * (`IPhonePlayer`, `OSXEditor`). Showing those verbatim made the console read
 * like a log file and meant the same concept appeared under different names on
 * different pages.
 *
 * Every surface now renders the friendly label and keeps the raw id available
 * as secondary text, so the console stays readable without hiding the exact
 * value an operator needs when cross-checking against GA4 or a store console.
 *
 * Deliberately dependency-free (no "server-only"): client components render
 * these labels too.
 */

/**
 * Google Analytics event names → plain English.
 *
 * Covers the automatically-collected Firebase/GA4 events plus the custom
 * events TrapMan logs. Anything unmapped falls back to a title-cased version
 * of the raw name, so a new event added by the game is still readable.
 */
const EVENT_LABELS: Record<string, string> = {
  // --- Session and engagement (automatically collected) ---
  first_open: "First time opening the game",
  session_start: "Play session started",
  session_end: "Play session ended",
  user_engagement: "Time actively playing",
  screen_view: "Screen viewed",
  app_clear_data: "Game data cleared",
  app_exception: "Game crashed",
  app_remove: "Game uninstalled",
  app_update: "Game updated",
  os_update: "Device OS updated",

  // --- Ads ---
  ad_impression: "Ad shown",
  ad_clicked: "Ad clicked",
  ad_closed: "Ad closed",
  ad_reward: "Ad reward earned",

  // --- Commerce ---
  purchase: "Purchase completed",
  in_app_purchase: "In-app purchase",
  ecommerce_purchase: "Purchase completed",
  refund: "Purchase refunded",
  add_to_cart: "Added to cart",
  begin_checkout: "Checkout started",

  // --- Gameplay ---
  level_start: "Level started",
  level_end: "Level finished",
  level_up: "Level completed",
  post_score: "Score submitted",
  unlock_achievement: "Achievement unlocked",
  tutorial_begin: "Tutorial started",
  tutorial_complete: "Tutorial finished",
  earn_virtual_currency: "In-game currency earned",
  spend_virtual_currency: "In-game currency spent",
  select_content: "Content selected",
  share: "Shared",

  // --- Push notifications ---
  notification_receive: "Notification received",
  notification_open: "Notification opened",
  notification_foreground: "Notification shown in-game",
  notification_dismiss: "Notification dismissed",
  notification_send: "Notification sent",

  // --- Acquisition ---
  campaign_details: "Install campaign details",
  firebase_campaign: "Install campaign",
  dynamic_link_first_open: "Opened from a link (first time)",
  dynamic_link_app_open: "Opened from a link",
};

/**
 * A short note on what an event actually measures, for the ones whose meaning
 * is not obvious from the name alone. Shown as helper text, never required.
 */
const EVENT_HINTS: Record<string, string> = {
  user_engagement:
    "Logged periodically while the game is in the foreground — it counts engagement pings, not players.",
  session_start: "One per play session, after 30 minutes of inactivity.",
  session_end: "Logged by the game when a play session finishes.",
  screen_view: "One per screen the player lands on, so it far exceeds sessions.",
  first_open: "Logged once per install — the closest thing to an install count.",
  app_remove: "Only reported on Android; Apple does not report uninstalls.",
};

/** Title-case an unknown snake_case identifier: `boss_defeated` → "Boss defeated". */
function humanise(raw: string): string {
  const words = raw.replace(/[_-]+/g, " ").trim();
  if (!words) return raw;
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

/** Plain-English name for a Google Analytics event. */
export function eventLabel(eventName: string): string {
  return EVENT_LABELS[eventName] ?? humanise(eventName);
}

/** Optional one-line explanation of what an event counts, or null. */
export function eventHint(eventName: string): string | null {
  return EVENT_HINTS[eventName] ?? null;
}

/** True when the console has a curated name for this event. */
export function isKnownEvent(eventName: string): boolean {
  return eventName in EVENT_LABELS;
}

// ─── Store products ──────────────────────────────────────────────────────────

/**
 * Store product ids → the product's name in the game.
 *
 * Keyed on the id's last segment so the same entry works whether the store
 * reports the fully-qualified id (`com.cultshotta.trapman.hearts_tier_1`) or
 * the bare sku (`hearts_tier_1`).
 */
const PRODUCT_LABELS: Record<string, string> = {
  ad_free_play: "Ad-free play",
  hearts_tier_1: "Hearts — Tier 1",
  hearts_tier_2: "Hearts — Tier 2",
  hearts_tier_3: "Hearts — Tier 3",
};

/** The bare sku from a store product id — the part after the last dot. */
export function productSku(productId: string): string {
  const parts = productId.split(".");
  return parts[parts.length - 1] || productId;
}

/** Plain-English name for a store product. */
export function productLabel(productId: string): string {
  const sku = productSku(productId);
  return PRODUCT_LABELS[sku] ?? humanise(sku);
}

// ─── Platforms ───────────────────────────────────────────────────────────────

/**
 * Normalised platform buckets → how they are shown to an operator. The raw
 * Unity strings (`IPhonePlayer`, `OSXEditor`) are never user-facing.
 */
const PLATFORM_LABELS: Record<string, string> = {
  ios: "iPhone / iPad",
  android: "Android",
  editor: "Unity Editor (not a real sale)",
  unknown: "Unknown",
};

export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? humanise(platform);
}
