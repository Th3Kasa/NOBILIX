import "server-only";
import { auth } from "@/auth";
import type { SessionAdmin } from "@/types";

/** Returns the current admin or throws (use inside server actions). */
export async function requireAdmin(): Promise<SessionAdmin> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
  };
}

/** Owners and admins may mutate data; viewers are read-only. */
export async function requireWriteAccess(): Promise<SessionAdmin> {
  const admin = await requireAdmin();
  if (admin.role === "viewer") {
    throw new Error("Your role is read-only.");
  }
  return admin;
}
