/**
 * Firestore collection names.
 *
 * GAME collections are owned by the TrapMan app — treat as the live source of truth.
 * Their exact names/fields are confirmed during Phase 0 discovery; defaults below match
 * the documented schema and can be overridden via env if discovery finds different names.
 *
 * CRM collections are owned by this admin console and prefixed with `_` so they never
 * collide with game data.
 */

// --- Game-owned (read/write the live DB) ---
export const GAME = {
  users: "users", // users/{uid}
  leaderboard: "leaderboard",
} as const;

// --- CRM-owned (this console only) ---
export const CRM = {
  admins: "_admin", // _admin/{adminId}
  audit: "_admin_audit", // _admin_audit/{autoId}
  campaigns: "_crm_campaigns", // _crm_campaigns/{autoId}
  competitions: "_crm_competitions", // _crm_competitions/{autoId} — archived competition snapshots
  exports: "_crm_exports", // _crm_exports/{autoId}
  metrics: "_crm_metrics", // _crm_metrics/{yyyy-mm-dd}
} as const;
