/**
 * TrapMan Privacy Policy content.
 *
 * This content is derived directly from TRAPMAN_DATA_INVENTORY.
 * Do not add data category claims here that are not reflected in the inventory.
 * Unresolved categories are listed in REQUIRES_ENGINEERING_VERIFICATION in data-inventory.ts.
 *
 * Legal Launch Gate: this content requires qualified legal review before publication as
 * final legal advice.
 */
import {
  TRAPMAN_DATA_INVENTORY,
  REQUIRES_ENGINEERING_VERIFICATION,
} from "@/content/trapman/data-inventory";

export { TRAPMAN_DATA_INVENTORY, REQUIRES_ENGINEERING_VERIFICATION };

export const PRIVACY_POLICY_LAST_UPDATED = "2026-06-26";

export const PRIVACY_SECTIONS = {
  introduction: {
    heading: "Introduction",
    body: `Nobilix Pty Ltd ("Nobilix", "we", "us") operates TrapMan, a mobile game available
    on iOS and Android. This Privacy Policy explains what information we collect when you play
    TrapMan, how we use it, and your rights over that information.

    TrapMan is intended for players aged 13 and over. We do not knowingly collect personal
    information from children under 13 without verifiable parental consent. If you believe
    your child under 13 has provided us with personal data, please contact us at
    help.nobilix@outlook.com so we can take appropriate action, including deletion.

    No date of birth is collected. By creating an account, you confirm you are at least 13
    years old. Parents or guardians wishing to request deletion of a child's account may
    contact help.nobilix@outlook.com.`,
  },

  dataWeCollect: {
    heading: "What We Collect",
    body: `The following data is stored in our systems when you play TrapMan. This list
    reflects confirmed fields from engineering review.`,
    notes: {
      agePolicy:
        "TrapMan is intended for users aged 13 and over. No birth date is collected.",
      analytics: `Firebase Analytics records session and ad interaction events.
      Analytics data is stored in aggregated form. Per-user event deletion is not instant —
      it depends on Firebase Analytics data deletion processes and timelines.
      Aggregated data without personal identifiers may persist beyond account deletion.`,
      adClosed: `The "ad_closed" event is recorded when a player closes an ad unit.
      This event indicates the ad was closed — it does not confirm the ad was fully
      completed. The exact trigger for this event is subject to engineering verification.`,
    },
  },

  unverifiedData: {
    heading: "Data Under Engineering Verification",
    body: `The following categories may be collected or processed by TrapMan's underlying
    systems but have not yet been formally verified by our engineering team. We do not claim
    to collect these categories until each has been individually confirmed and this policy
    is updated.`,
  },

  dataRetention: {
    heading: "Data Retention",
    body: `Firestore profile data (username, email, country, competition history) is retained
    until you delete your account. On deletion, your user profile, progress data, and
    leaderboard entries are removed or anonymized.

    Purchase receipt records may be retained for financial compliance and dispute resolution
    purposes. Personal identifiers within retained purchase records are anonymized where
    retention is required.

    Firebase Analytics aggregated event data follows Firebase's data retention settings.
    Per-user event deletion is processed according to Firebase's documented timelines and
    may not be instant.`,
  },

  yourRights: {
    heading: "Your Rights",
    intro: "You have the right to:",
    rights: [
      "Access the personal data we hold about you (contact help.nobilix@outlook.com)",
      "Request a copy of your data in a portable format (contact help.nobilix@outlook.com)",
      "Correct inaccurate data (by updating your profile or contacting support)",
      "Delete your account and associated personal data (see /trapman/delete-account)",
      "Lodge a complaint with a relevant data protection authority",
    ],
    outro: "To exercise any of these rights, contact help.nobilix@outlook.com.",
  },

  childrenPolicy: {
    heading: "Children's Privacy",
    body: `TrapMan is intended for players aged 13 and over. We do not collect a date of
    birth and rely on players' confirmation that they meet the age requirement. We do not
    knowingly collect personal information from children under 13.

    Parents or guardians who believe their child under 13 has created a TrapMan account
    may contact help.nobilix@outlook.com to request account deletion. We will process
    such requests in accordance with applicable law.`,
  },

  contact: {
    heading: "Contact Us",
    body: `For privacy questions or to exercise your rights, contact:
    Nobilix Pty Ltd — help.nobilix@outlook.com`,
  },
} as const;
