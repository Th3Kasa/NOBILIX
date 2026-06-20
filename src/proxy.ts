import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe: uses only the DB-free config. Route protection lives in the
// `authorized` callback in auth.config.ts.
export default NextAuth(authConfig).auth;

export const config = {
  // Only the admin console is auth-gated. The public marketing site (/, /legal,
  // /privacy-policy, …), static assets, and the auth API stay open.
  matcher: ["/console/:path*"],
};
