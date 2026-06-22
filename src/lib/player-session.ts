import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthAdmin } from "@/lib/firebase/auth";

export const PLAYER_SESSION_COOKIE = "__Host-nobilix-player";

export async function getPlayerSession(): Promise<{
  uid: string;
  email?: string;
} | null> {
  const value = (await cookies()).get(PLAYER_SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const decoded = await getAuthAdmin().verifySessionCookie(value, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

export async function requirePlayerSession(): Promise<{
  uid: string;
  email?: string;
}> {
  const session = await getPlayerSession();
  if (!session) redirect("/trapman/account/login");
  return session;
}
