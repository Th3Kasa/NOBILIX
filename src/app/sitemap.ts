import type { MetadataRoute } from "next";
import { PROJECTS } from "@/config/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const trapman = PROJECTS.trapman;
  const paths = [
    "/",
    "/legal",
    trapman.publicPath,
    trapman.legal.privacy,
    trapman.legal.terms,
    trapman.legal.compliance,
    trapman.legal.deletion,
  ];
  return paths.map((path) => ({
    url: new URL(path, "https://nobilix.vercel.app").toString(),
    lastModified: new Date(),
  }));
}
