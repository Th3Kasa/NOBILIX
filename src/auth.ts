import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import {
  getAdminByEmail,
  getAdminById,
  isLocked,
  registerFailedAttempt,
  registerSuccessfulLogin,
  verifyPassword,
} from "@/lib/admins";
import { decrypt } from "@/lib/crypto";
import { verifyTotp } from "@/lib/totp";
import { recordAudit } from "@/lib/audit";
import { consumeLoginTicket } from "@/lib/login-tickets";
import type { AdminRole } from "@/types";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().min(6).max(8),
});

// 32 random bytes base64url-encoded → 43 chars.
const ticketSchema = z.object({
  ticket: z.string().min(40).max(48),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        totp: {},
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, totp } = parsed.data;

        const admin = await getAdminByEmail(email);
        // Run a dummy compare to keep timing roughly constant for unknown users.
        if (!admin) {
          await new Promise((r) => setTimeout(r, 200));
          return null;
        }

        if (isLocked(admin)) {
          await recordAudit({
            actorId: admin.id,
            actorEmail: admin.email,
            action: "auth.login.locked",
          });
          return null;
        }

        const passwordOk = await verifyPassword(admin, password);
        if (!passwordOk) {
          await registerFailedAttempt(admin);
          await recordAudit({
            actorId: admin.id,
            actorEmail: admin.email,
            action: "auth.login.bad_password",
          });
          return null;
        }

        // TOTP must be enrolled and valid.
        if (!admin.totpEnrolled || !admin.totpSecretEnc) {
          return null; // must complete /enroll first
        }
        const secret = decrypt(admin.totpSecretEnc);
        if (!verifyTotp(totp, secret)) {
          await registerFailedAttempt(admin);
          await recordAudit({
            actorId: admin.id,
            actorEmail: admin.email,
            action: "auth.login.bad_totp",
          });
          return null;
        }

        await registerSuccessfulLogin(admin.id);
        await recordAudit({
          actorId: admin.id,
          actorEmail: admin.email,
          action: "auth.login.success",
        });

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
    /**
     * Passkey session bridge. The WebAuthn assertion is verified in the
     * finishPasskeyLogin server action, which mints a single-use ticket and
     * spends it here without it ever reaching the browser. The ticket check
     * is load-bearing: this provider is HTTP-reachable at
     * /api/auth/callback/passkey like any other.
     */
    Credentials({
      id: "passkey",
      name: "Passkey",
      credentials: { ticket: {} },
      async authorize(raw) {
        const parsed = ticketSchema.safeParse(raw);
        if (!parsed.success) return null;

        // Transactional consume — a ticket can never be spent twice.
        const adminId = await consumeLoginTicket(parsed.data.ticket);
        if (!adminId) return null;

        // Defense in depth: the action already checked these.
        const admin = await getAdminById(adminId);
        if (!admin || isLocked(admin)) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: AdminRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AdminRole;
      }
      return session;
    },
  },
});

/** Convenience for server code that needs the live admin record. */
export async function getCurrentAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return getAdminById(session.user.id);
}
