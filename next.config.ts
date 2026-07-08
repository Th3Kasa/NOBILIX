import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Site-wide Content Security Policy. Every asset is self-hosted (next/font
 * self-hosts the Google fonts at build time; all images/video/audio live in
 * /public), so no external origins are allowed at all.
 *
 * `'unsafe-inline'` in script-src is required by Next.js's inline hydration
 * payloads on statically rendered pages (a nonce-based policy would force
 * dynamic rendering site-wide). The policy still blocks every external
 * script/frame/object origin and form hijacking. `'unsafe-eval'` is
 * dev-only — React uses eval for error overlays in development.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  // Firebase signInWithPopup drives auth through a helper iframe on the
  // project's authDomain (<project>.firebaseapp.com/__/auth/*).
  "frame-src 'self' https://*.firebaseapp.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // publickey-credentials-* scoped to self: passkey ceremonies work on our
    // own pages but can never be driven from an embedding context.
    value:
      "camera=(), microphone=(), geolocation=(), publickey-credentials-get=(self), publickey-credentials-create=(self)",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacy-policy", destination: "/trapman/privacy-policy", permanent: true },
      { source: "/terms-of-use", destination: "/trapman/terms-of-use", permanent: true },
      { source: "/data-compliance", destination: "/trapman/data-compliance", permanent: true },
      // Legacy console redirects — non-permanent during migration to /console/trapman/*
      { source: "/console/users/:path*", destination: "/console/trapman/users/:path*", permanent: false },
      { source: "/console/leaderboard/:path*", destination: "/console/trapman/leaderboard/:path*", permanent: false },
      { source: "/console/messaging/:path*", destination: "/console/trapman/messaging/:path*", permanent: false },
      { source: "/console/analytics/:path*", destination: "/console/trapman/analytics/:path*", permanent: false },
      { source: "/console/purchases/:path*", destination: "/console/trapman/purchases/:path*", permanent: false },
      { source: "/console/exports/:path*", destination: "/console/trapman/exports/:path*", permanent: false },
      { source: "/console/audit/:path*", destination: "/console/trapman/audit/:path*", permanent: false },
      { source: "/console/settings/:path*", destination: "/console/trapman/settings/:path*", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
