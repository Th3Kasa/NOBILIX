/**
 * TrapMan data inventory.
 *
 * TRAPMAN_DATA_INVENTORY: confirmed data categories with system, location, and purpose.
 * REQUIRES_ENGINEERING_VERIFICATION: data categories that are plausibly collected but
 *   have not yet been formally verified by engineering review. These are NOT claimed as
 *   collected in legal documents until confirmed and this list is updated.
 *
 * Legal Launch Gate: this inventory must be signed off by engineering AND qualified
 * legal review before the legal pages go live as final legal advice.
 */

export interface DataInventoryEntry {
  /** Unique key identifying the data field or category */
  key: string;
  /** The system that stores or processes this data */
  system: string;
  /** The collection/document path or service endpoint */
  location: string;
  /** The purpose for which this data is collected/used */
  purpose: string;
  /** Whether the player can request deletion */
  deletable: boolean;
  /** Notes on deletion limitations, if any */
  deletionNote?: string;
}

export const TRAPMAN_DATA_INVENTORY = [
  {
    key: "username",
    system: "Firestore",
    location: "users/{uid}",
    purpose: "Display name shown on leaderboards and in the player portal.",
    deletable: true,
  },
  {
    key: "email",
    system: "Firebase Authentication + Firestore",
    location: "Firebase Auth record + users/{uid}.email",
    purpose:
      "Account identity and player communications. Stored in Firebase Auth and mirrored to the users Firestore document.",
    deletable: true,
    deletionNote:
      "Deleting the account removes both the Auth record and the Firestore user document.",
  },
  {
    key: "country",
    system: "Firestore",
    location: "users/{uid}.country",
    purpose:
      "Regional segmentation for leaderboards and applicable law compliance.",
    deletable: true,
  },
  {
    key: "competitionsWon",
    system: "Firestore",
    location: "users/{uid} or player_progress/{uid}",
    purpose: "Tracks competition wins for leaderboard and in-game rewards.",
    deletable: true,
  },
  {
    key: "purchaseReceiptRecord",
    system: "Firestore",
    location: "purchases/{autoId}",
    purpose:
      "Records in-app purchase transactions for receipt and dispute resolution.",
    deletable: false,
    deletionNote:
      "Purchase receipt records may be retained for financial compliance and dispute resolution. Personal identifiers within receipts are anonymized on account deletion where retention is required.",
  },
  {
    key: "purchasedProductId",
    system: "Firestore",
    location: "purchases/{autoId}.productId",
    purpose:
      "Identifies which in-app product was purchased (e.g., character skin, power-up pack).",
    deletable: false,
    deletionNote:
      "Retained as part of purchase receipt. Personal identifiers are anonymized on account deletion where retention applies.",
  },
  {
    key: "sessionEndDurationMs",
    system: "Firebase Analytics",
    location: "Analytics event: session_end — parameter: duration_ms",
    purpose:
      "Records total milliseconds of a play session for aggregate playtime analytics.",
    deletable: false,
    deletionNote:
      "Firebase Analytics stores aggregate event data. Per-user event deletion is not instant and depends on Firebase Analytics data deletion processes. Aggregate data without personal identifiers may persist.",
  },
  {
    key: "adClosed",
    system: "Firebase Analytics",
    location: "Analytics event: ad_closed",
    purpose:
      "Recorded when the player closes a rewarded or interstitial ad. Does not confirm the ad was fully completed — engineering verification of the exact trigger is pending.",
    deletable: false,
    deletionNote: "Subject to Firebase Analytics data deletion timelines.",
  },
  {
    key: "adClicked",
    system: "Firebase Analytics",
    location: "Analytics event: ad_clicked",
    purpose:
      "Recorded when the player clicks or interacts with an ad unit.",
    deletable: false,
    deletionNote: "Subject to Firebase Analytics data deletion timelines.",
  },
] as const satisfies DataInventoryEntry[];

/**
 * Data categories that are plausibly collected or processed by TrapMan but
 * have NOT been formally verified by engineering review.
 *
 * These categories MUST NOT be described as confirmed collected data in legal documents
 * until each item is individually investigated and this list is updated.
 *
 * Mark as "Under engineering verification; not claimed as collected until confirmed."
 * in any user-facing document that references this list.
 */
export const REQUIRES_ENGINEERING_VERIFICATION = [
  "Firebase Analytics automatic events and user properties (e.g., first_open, app_update, os_version, country derived from IP)",
  "Device identifiers including Google Advertising ID (GAID) and Apple IDFA — depends on consent and attribution SDK",
  "FCM tokens and push notification delivery data",
  "Crash reporting data (e.g., Firebase Crashlytics — stack traces, device model, OS version)",
  "Guest account behavior and data — whether guest sessions generate any persistent storage",
  "Advertising SDKs and their destination processors — depends on which SDKs are integrated and their data sharing practices",
] as const;
