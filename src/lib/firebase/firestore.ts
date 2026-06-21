import "server-only";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getFirebaseApp } from "@/lib/firebase/app";

let db: Firestore | undefined;

export function getDb(): Firestore {
  if (db) return db;
  db = getFirestore(getFirebaseApp());
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() throws if called twice during hot reload.
  }
  return db;
}
