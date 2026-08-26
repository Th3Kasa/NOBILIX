/**
 * Classifies the email identity a player account carries.
 *
 * Apple's Sign in with Apple offers "Hide My Email", which issues an
 * `@privaterelay.appleid.com` alias. Apple never discloses the underlying
 * address to the developer and provides no API to resolve it — that is the
 * whole point of the feature, and attempting to correlate it back to a real
 * identity is against Apple's developer terms. The alias is still deliverable:
 * mail sent to it forwards to the player's real inbox.
 *
 * Guests have no email at all, which is the case that actually blocks contact.
 */

export type PlayerEmailKind = "real" | "apple-relay" | "none";

export interface PlayerEmailIdentity {
  kind: PlayerEmailKind;
  /** The address to display and to send mail to, when there is one. */
  address: string | null;
  /** Short label for the console UI. */
  label: string;
  /** Why the console shows what it shows — surfaced as a hint/tooltip. */
  note: string;
  /** Whether email can actually reach this player. */
  contactable: boolean;
}

const APPLE_RELAY_DOMAIN = /@privaterelay\.appleid\.com$/i;

export function classifyPlayerEmail(
  email: string | null | undefined,
): PlayerEmailIdentity {
  const address = typeof email === "string" ? email.trim() : "";

  if (!address) {
    return {
      kind: "none",
      address: null,
      label: "No email",
      note: "Guest account — no email was ever collected, so this player cannot be contacted by email.",
      contactable: false,
    };
  }

  if (APPLE_RELAY_DOMAIN.test(address)) {
    return {
      kind: "apple-relay",
      address,
      label: "Apple private relay",
      note: "The player chose Hide My Email. Apple does not disclose the real address to developers, but mail sent to this alias is forwarded to them.",
      contactable: true,
    };
  }

  return {
    kind: "real",
    address,
    label: "Email",
    note: "Address supplied by the player.",
    contactable: true,
  };
}
