"use client";

import { LogOut, Search } from "lucide-react";
import { logout } from "@/app/console/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { openCommandPalette } from "@/components/console/command-palette";
import type { AdminRole } from "@/types";

export function Topbar({
  name,
  email,
  role,
  projectName,
}: {
  name: string;
  email: string;
  role: AdminRole;
  projectName?: string;
}) {
  const initials = (name || email)
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/40 px-4 md:px-6">
      <span className="font-mono text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {projectName ? (
          <>
            <span className="text-xs">Nobilix</span>
            <span className="mx-1.5 text-muted-foreground/50">/</span>
            {projectName}
          </>
        ) : (
          "Nobilix"
        )}
      </span>
      <div className="ml-auto flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open command palette"
          title="Command palette (Ctrl/Cmd+K)"
          onClick={openCommandPalette}
        >
          <Search className="size-4" aria-hidden="true" />
        </Button>
        <div className="hidden text-right sm:block" aria-label="Signed in administrator">
          <p className="text-sm font-medium leading-tight">{name}</p>
          <p className="text-xs text-muted-foreground leading-tight">{email}</p>
        </div>
        <Badge
          variant={role === "owner" ? "default" : "secondary"}
          className="font-mono uppercase tracking-wide"
        >
          {role}
        </Badge>
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {initials}
        </div>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
