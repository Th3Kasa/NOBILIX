import type { NextConfig } from "next";

/**
 * The public NOBILIX marketing site is served as hand-crafted static HTML from
 * `public/site/*` (byte-for-byte identical to the original site). These rewrites
 * map the clean public URLs to those files. Everything under `/console` is the
 * admin CRM (Next.js app routes, auth-gated by `src/proxy.ts`).
 */
const nextConfig: NextConfig = {
  // Next.js 16 automatically externalizes firebase-admin. Keep Firebase
  // services in separate modules so Firestore-only routes do not load Auth's
  // CommonJS dependency graph during server-function initialization.

  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/site/index.html" },
        { source: "/privacy-policy", destination: "/site/privacy-policy.html" },
        { source: "/terms-of-use", destination: "/site/terms-of-use.html" },
        { source: "/data-compliance", destination: "/site/data-compliance.html" },
        { source: "/delete-account", destination: "/site/delete-account.html" },
        { source: "/legal", destination: "/site/legal.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
