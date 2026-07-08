/**
 * TrapMan Data & Compliance content.
 *
 * The technical data table is derived from TRAPMAN_DATA_INVENTORY.
 * Do not maintain a parallel copy of data categories in this file.
 *
 * Legal Launch Gate: requires engineering sign-off and qualified legal review.
 */
import {
  TRAPMAN_DATA_INVENTORY,
  REQUIRES_ENGINEERING_VERIFICATION,
} from "@/content/trapman/data-inventory";

export { TRAPMAN_DATA_INVENTORY, REQUIRES_ENGINEERING_VERIFICATION };

export const COMPLIANCE_LAST_UPDATED = "2026-06-26";

export const COMPLIANCE_SECTIONS = {
  overview: {
    heading: "Data & Compliance Overview",
    body: `This page provides a technical summary of the data collected and processed by
    TrapMan, Nobilix's live mobile game. It is intended for players who want to understand
    our data practices in detail.

    The data table below reflects confirmed fields from engineering review. Categories that
    are under investigation but not yet confirmed are listed separately.`,
  },

  verificationNotice: {
    heading: "Under Engineering Verification",
    body: `The following data categories may be collected or processed by TrapMan's
    underlying services, but have not yet been formally verified by our engineering team.
    We do not claim to collect these categories until each has been individually confirmed.

    These items are marked as: "Under engineering verification; not claimed as collected
    until confirmed."`,
  },

  deletionRights: {
    heading: "Your Data Deletion Rights",
    body: `To delete your TrapMan account, contact help.nobilix@outlook.com. On deletion:

    - Your user profile (username, email, country, competition data) is deleted from Firestore.
    - Your progress record (player_progress/{uid}) is deleted.
    - Your leaderboard entry is removed or anonymized.
    - Your Firebase Auth record is deleted.

    Purchase receipt records may be retained for financial compliance. Personal identifiers
    within retained purchase records are anonymized.

    Firebase Analytics aggregated event data follows Firebase's documented deletion timelines.
    Aggregated data without personal identifiers may persist.`,
  },

} as const;
