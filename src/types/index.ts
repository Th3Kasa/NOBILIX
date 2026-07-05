/** Shared domain types for the NOBILIX Admin Console. */

export type AdminRole = "owner" | "admin" | "viewer";

/**
 * Per-admin layout for the project overview. `order` and `hidden` hold
 * widget ids from the overview registry; ids the registry no longer knows
 * are ignored on read, and new widgets default to visible at the end.
 */
export interface OverviewPrefs {
  order: string[];
  hidden: string[];
  updatedAt?: number;
}

export interface AdminRecord {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  /** AES-256-GCM encrypted TOTP secret (never the raw secret). */
  totpSecretEnc: string | null;
  totpEnrolled: boolean;
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms
  lastLoginAt: number | null;
  createdAt: number;
  overviewPrefs?: OverviewPrefs | null;
}

/** Admin object exposed to the session (no secrets). */
export interface SessionAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/**
 * A WebAuthn credential registered by an admin. Stored in `_admin_passkeys`
 * with the base64url credentialId as the document id, so login lookups are a
 * single doc read.
 */
export interface PasskeyRecord {
  /** Document id — equals credentialId. */
  id: string;
  credentialId: string;
  adminId: string;
  /** base64url of the COSE public key bytes. */
  publicKey: string;
  counter: number;
  transports: string[];
  deviceType: "singleDevice" | "multiDevice";
  backedUp: boolean;
  /** User-facing label, e.g. "MacBook Touch ID". */
  name: string;
  createdAt: number;
  lastUsedAt: number | null;
}

/** A game player as stored in Firestore users/{uid}. Fields confirmed in Phase 0. */
export interface GameUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  country?: string | null; // ISO 3166-1 alpha-2
  character?: string | null;
  level?: number | null;
  highScore?: number | null;
  fcmToken?: string | null;
  isGuest?: boolean;
  createdAt?: number | null;
  lastSeenAt?: number | null;
  /** Any extra fields discovered at runtime are preserved. */
  [key: string]: unknown;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string; // e.g. "user.delete", "push.send", "auth.login"
  target?: string | null; // affected resource id
  metadata?: Record<string, unknown> | null;
  at: number; // epoch ms
}

export type CampaignAudience =
  | { type: "single"; uid: string }
  | { type: "broadcast" }
  | {
      type: "segment";
      filters: {
        country?: string;
        minLevel?: number;
        maxLevel?: number;
        character?: string;
        lastActiveDays?: number;
      };
    };

export interface LeaderboardEntry {
  uid: string;
  displayName?: string | null;
  score: number;
  rank?: number | null;
  country?: string | null;
  character?: string | null;
  updatedAt?: number | null;
}

export type CompetitionPeriod = "daily" | "weekly" | "monthly" | "custom";

export interface CompetitionRecord {
  id: string;
  periodType: CompetitionPeriod;
  label: string;
  resetAt: number;
  resetBy: string;
  totalEntries: number;
  winners: LeaderboardEntry[];
}

export interface CampaignRecord {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string> | null;
  audience: CampaignAudience;
  status: "draft" | "sending" | "sent" | "failed";
  recipientCount: number;
  successCount: number;
  failureCount: number;
  createdBy: string;
  createdAt: number;
  sentAt: number | null;
}
