import type { ProjectDefinition, ProjectSlug } from "@/types/projects";

export const PROJECTS = {
  trapman: {
    slug: "trapman",
    name: "TrapMan",
    kind: "game",
    status: "live",
    description: "A neon pixel-art city chase built by Nobilix.",
    logoPath: "/assets/trapman-logo.png",
    publicPath: "/trapman",
    accountPath: "/trapman/account",
    legal: {
      privacy: "/trapman/privacy-policy",
      terms: "/trapman/terms-of-use",
      compliance: "/trapman/data-compliance",
      deletion: "/trapman/delete-account",
    },
    consoleModules: [
      "overview",
      "users",
      "leaderboard",
      "purchases",
      "analytics",
      "gameplay",
      "ads",
      "messaging",
      "exports",
      "audit",
      "settings",
    ],
    collections: {
      users: "users",
      leaderboard: "leaderboard",
      purchases: "purchases",
      progress: "player_progress",
    },
  },
} as const satisfies Record<ProjectSlug, ProjectDefinition>;

export function getProject(slug: ProjectSlug): ProjectDefinition {
  return PROJECTS[slug];
}
