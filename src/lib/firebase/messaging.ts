import "server-only";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { getFirebaseApp } from "@/lib/firebase/app";

export function getMessagingAdmin(): Messaging {
  return getMessaging(getFirebaseApp());
}
