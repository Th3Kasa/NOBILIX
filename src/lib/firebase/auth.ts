import "server-only";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirebaseApp } from "@/lib/firebase/app";

export function getAuthAdmin(): Auth {
  return getAuth(getFirebaseApp());
}
