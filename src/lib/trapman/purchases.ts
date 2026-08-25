/**
 * The single source of truth for reading TrapMan purchase records.
 *
 * Purchases are stored embedded on the player document at
 * `users/{uid}.purchases`. The game writes TWO different shapes depending on
 * the store, and every reader in the console must handle both identically —
 * previously three separate parsers disagreed, so the Overview, Purchases and
 * Players pages reported different totals for the same data.
 *
 *   Apple  (flat):   purchases[purchaseId] = { productId, price, currency,
 *                                              platform, timestamp, receipt }
 *
 *   Google (nested): purchases[shortToken] = {
 *                      [fullPurchaseToken]: { productId, price, currency,
 *                                             platform, timestamp, receipt }
 *                    }
 *
 * The inner object of the Google shape is identical to the Apple shape — it is
 * just wrapped one level deeper, keyed by the full purchase token. Unwrapping
 * that layer is the whole difference.
 *
 * Nothing here trusts the client's numbers as verified revenue; it only makes
 * the records readable and consistently classified. Server-side receipt
 * verification against the stores is a separate concern.
 */

/** Fields every usable purchase record must carry. */
const REQUIRED_STRING_FIELDS = ["productId", "currency", "platform"] as const;
const REQUIRED_NUMBER_FIELDS = ["price", "timestamp"] as const;

export interface NormalizedPurchase {
  /** Stable identity: the store order id when present, else the map key. */
  purchaseId: string;
  productId: string;
  price: number;
  /** Upper-cased ISO currency code as written by the store. */
  currency: string;
  /** Normalised bucket: "ios" | "android" | "editor" | lower-cased original. */
  platform: PurchasePlatform;
  /** Exactly what the client wrote, kept for forensics. */
  rawPlatform: string;
  /** Epoch milliseconds. */
  timestamp: number;
  buyerUid: string;
  buyerName: string | null;
  /** Google `GPA.…` order id or Apple transaction id, when recoverable. */
  storeOrderId: string | null;
  /** Google Play purchase token, when recoverable. */
  purchaseToken: string | null;
  /**
   * Google Play only. An unacknowledged purchase is automatically refunded and
   * revoked by Google after three days, so `false` here is worth surfacing.
   */
  acknowledged: boolean | null;
  /**
   * True when the purchase came from a Unity Editor session (OSXEditor,
   * WindowsEditor, …). These never touched a real store and are never revenue.
   */
  isEditorPurchase: boolean;
}

export type PurchasePlatform = "ios" | "android" | "editor" | (string & {});

export interface UnparsedPurchase {
  /** The map key the record was stored under. */
  key: string;
  buyerUid: string;
  buyerName: string | null;
  /** Why the record could not be read, for the forensics view. */
  reason: string;
}

export interface ParsedPurchaseMap {
  purchases: NormalizedPurchase[];
  unparsed: UnparsedPurchase[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when an object carries the full flat purchase shape. */
function hasPurchaseShape(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  return (
    REQUIRED_STRING_FIELDS.every((f) => typeof value[f] === "string") &&
    REQUIRED_NUMBER_FIELDS.every((f) => typeof value[f] === "number")
  );
}

/** Unity's runtime platform strings → the buckets the console groups by. */
export function normalisePlatform(raw: string): PurchasePlatform {
  const p = raw.trim().toLowerCase();
  if (p.includes("editor")) return "editor";
  if (p.includes("iphone") || p.includes("ios") || p.includes("ipad")) return "ios";
  if (p.includes("android")) return "android";
  return p || "unknown";
}

/**
 * Pulls the order id, purchase token and acknowledgement state out of a Google
 * Play receipt envelope. Returns nulls for Apple receipts or anything
 * unreadable — a malformed receipt must never discard an otherwise good record.
 */
function readReceiptMeta(receipt: unknown): {
  storeOrderId: string | null;
  purchaseToken: string | null;
  acknowledged: boolean | null;
} {
  const empty = { storeOrderId: null, purchaseToken: null, acknowledged: null };
  if (typeof receipt !== "string") return empty;
  try {
    const envelope = JSON.parse(receipt) as Record<string, unknown>;
    if (typeof envelope.json !== "string") return empty;
    const inner = JSON.parse(envelope.json) as Record<string, unknown>;
    return {
      storeOrderId: typeof inner.orderId === "string" ? inner.orderId : null,
      purchaseToken:
        typeof inner.purchaseToken === "string" ? inner.purchaseToken : null,
      acknowledged:
        typeof inner.acknowledged === "boolean" ? inner.acknowledged : null,
    };
  } catch {
    return empty;
  }
}

function buildPurchase(
  key: string,
  record: Record<string, unknown>,
  buyerUid: string,
  buyerName: string | null,
): NormalizedPurchase {
  const rawPlatform = String(record.platform);
  const meta = readReceiptMeta(record.receipt);
  return {
    purchaseId: meta.storeOrderId ?? key,
    productId: String(record.productId),
    price: Number(record.price),
    currency: String(record.currency).toUpperCase(),
    platform: normalisePlatform(rawPlatform),
    rawPlatform,
    timestamp: Number(record.timestamp),
    buyerUid,
    buyerName,
    storeOrderId: meta.storeOrderId,
    purchaseToken: meta.purchaseToken,
    acknowledged: meta.acknowledged,
    isEditorPurchase: normalisePlatform(rawPlatform) === "editor",
  };
}

/**
 * Reads one player's embedded purchases map, handling both store shapes.
 * Records that cannot be read are returned separately with a reason rather
 * than being silently dropped.
 */
export function parsePurchaseMap(
  buyerUid: string,
  buyerName: string | null,
  map: unknown,
): ParsedPurchaseMap {
  const purchases: NormalizedPurchase[] = [];
  const unparsed: UnparsedPurchase[] = [];

  if (!isRecord(map)) return { purchases, unparsed };

  for (const [key, value] of Object.entries(map)) {
    // Apple: the fields sit directly on the value.
    if (hasPurchaseShape(value)) {
      purchases.push(buildPurchase(key, value, buyerUid, buyerName));
      continue;
    }

    // Google: one level deeper, keyed by the full purchase token.
    if (isRecord(value)) {
      const inner = Object.entries(value).filter(([, v]) => hasPurchaseShape(v));
      if (inner.length > 0) {
        for (const [token, record] of inner) {
          purchases.push(
            buildPurchase(token, record as Record<string, unknown>, buyerUid, buyerName),
          );
        }
        continue;
      }
    }

    unparsed.push({
      key,
      buyerUid,
      buyerName,
      reason: !isRecord(value)
        ? `value is ${Array.isArray(value) ? "an array" : typeof value}, not an object`
        : `missing required fields (has: ${Object.keys(value).join(", ") || "nothing"})`,
    });
  }

  return { purchases, unparsed };
}

/** Reads the player's display name the same way across every console surface. */
export function buyerNameFrom(data: Record<string, unknown>): string | null {
  for (const field of ["username", "displayName", "name"]) {
    const v = data[field];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}
