import "server-only";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { env } from "@/lib/env";

/**
 * Firebase Admin SDK — lazily initialized singleton.
 *
 * Server-only. The service account grants full read/write to the live TrapMan
 * Firebase project (Firestore, Auth, Cloud Messaging), so this module must never
 * be imported into client code — `server-only` enforces that at build time.
 *
 * Initialization is deferred until first use so `next build` never parses
 * credentials when none are present.
 */

function resolveServiceAccount(): ServiceAccount {
  if (env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const json = Buffer.from(
      env.FIREBASE_SERVICE_ACCOUNT_B64,
      "base64",
    ).toString("utf8");
    const parsed = JSON.parse(json) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  }

  return {
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    // Vercel/.env store newlines escaped; restore them.
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

let _app: App | undefined;
let _db: Firestore | undefined;

function getApp(): App {
  if (_app) return _app;
  const existing = getApps();
  _app = existing.length
    ? existing[0]
    : initializeApp({ credential: cert(resolveServiceAccount()) });
  return _app;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getApp());
  try {
    _db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() throws if called twice (hot reload); safe to ignore.
  }
  return _db;
}

export function getAuthAdmin(): Auth {
  return getAuth(getApp());
}

export function getMessagingAdmin(): Messaging {
  return getMessaging(getApp());
}
