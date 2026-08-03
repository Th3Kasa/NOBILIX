import type { MetadataRoute } from "next";
import { PROJECTS } from "@/config/projects";
import { SITE_URL } from "@/lib/env";
import { PRIVACY_POLICY_LAST_UPDATED } from "@/content/trapman/privacy";
import { TERMS_LAST_UPDATED } from "@/content/trapman/terms";
import { COMPLIANCE_LAST_UPDATED } from "@/content/trapman/compliance";
import { DELETE_ACCOUNT_LAST_UPDATED } from "@/app/(public)/trapman/delete-account/page";
import { LAST_UPDATED as NOBILIX_PRIVACY_LAST_UPDATED } from "@/app/(public)/legal/privacy-policy/page";
import { LAST_UPDATED as NOBILIX_TERMS_LAST_UPDATED } from "@/app/(public)/legal/terms-of-use/page";

export default function sitemap(): MetadataRoute.Sitemap {
  const trapman = PROJECTS.trapman;
  const entries: { path: string; lastModified?: Date | string }[] = [
    // Index pages have no single "content" date — leave lastModified as now.
    { path: "/" },
    { path: "/legal" },
    { path: "/legal/privacy-policy", lastModified: NOBILIX_PRIVACY_LAST_UPDATED },
    { path: "/legal/terms-of-use", lastModified: NOBILIX_TERMS_LAST_UPDATED },
    { path: trapman.legal.privacy, lastModified: PRIVACY_POLICY_LAST_UPDATED },
    { path: trapman.legal.terms, lastModified: TERMS_LAST_UPDATED },
    { path: trapman.legal.compliance, lastModified: COMPLIANCE_LAST_UPDATED },
    { path: trapman.legal.deletion, lastModified: DELETE_ACCOUNT_LAST_UPDATED },
  ];
  return entries.map(({ path, lastModified }) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified: lastModified ? new Date(lastModified) : new Date(),
  }));
}
