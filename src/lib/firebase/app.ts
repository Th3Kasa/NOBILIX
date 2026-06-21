import "server-only";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { env } from "@/lib/env";

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
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

let app: App | undefined;

export function getFirebaseApp(): App {
  if (app) return app;
  const existing = getApps();
  app =
    existing.length > 0
      ? existing[0]
      : initializeApp({ credential: cert(resolveServiceAccount()) });
  return app;
}
