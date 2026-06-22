import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacy-policy", destination: "/trapman/privacy-policy", permanent: true },
      { source: "/terms-of-use", destination: "/trapman/terms-of-use", permanent: true },
      { source: "/data-compliance", destination: "/trapman/data-compliance", permanent: true },
      { source: "/delete-account", destination: "/trapman/delete-account", permanent: true },
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
