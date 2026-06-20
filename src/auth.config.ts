import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no database / Node-only imports).
 * Shared by middleware and the full Node config in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/console/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8-hour admin sessions
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute =
        nextUrl.pathname.startsWith("/console/login") ||
        nextUrl.pathname.startsWith("/console/enroll");

      if (isAuthRoute) {
        // Logged-in admins shouldn't sit on the login page.
        if (isLoggedIn && nextUrl.pathname.startsWith("/console/login")) {
          return Response.redirect(new URL("/console", nextUrl));
        }
        return true;
      }
      // Everything else under the proxy matcher (/console/*) requires a session.
      return isLoggedIn;
    },
  },
  providers: [], // defined in auth.ts (Node runtime)
} satisfies NextAuthConfig;
