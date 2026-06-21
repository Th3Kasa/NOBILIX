import "server-only";

/**
 * Compatibility shim for temporary diagnostic code.
 *
 * Production modules must import the service-specific Firebase module so a
 * Firestore-only route never loads Firebase Auth or Messaging transitively.
 */
export { getDb } from "@/lib/firebase/firestore";
