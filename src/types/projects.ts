export type ProjectSlug = "trapman";

export type ConsoleModule =
  | "overview"
  | "users"
  | "leaderboard"
  | "purchases"
  | "analytics"
  | "gameplay"
  | "ads"
  | "messaging"
  | "exports"
  | "audit"
  | "settings";

export interface ProjectDefinition {
  slug: ProjectSlug;
  name: string;
  kind: "game" | "application" | "crm";
  status: "live" | "development" | "planned";
  description: string;
  logoPath: string;
  legal: {
    privacy: string;
    terms: string;
    compliance: string;
  };
  consoleModules: readonly ConsoleModule[];
  collections: {
    users: string;
    leaderboard: string;
    purchases: string;
    progress: string;
  };
}
