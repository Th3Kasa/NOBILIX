"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/console/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminRole } from "@/types";

export function Topbar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: AdminRole;
}) {
  const initials = (name || email)
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/40 px-4 md:px-6">
      <span className="text-sm font-medium text-muted-foreground md:hidden">
        NOBILIX
      </span>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{name}</p>
          <p className="text-xs text-muted-foreground leading-tight">{email}</p>
        </div>
        <Badge variant={role === "owner" ? "default" : "secondary"}>
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
