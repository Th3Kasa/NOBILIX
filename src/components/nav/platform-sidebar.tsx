"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, LayoutGrid, User, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_NAV = [
  { href: "/console", label: "Projects", icon: LayoutGrid },
  { href: "/console/settings", label: "Admin profile", icon: User },
  { href: "/console/audit", label: "Audit activity", icon: ScrollText },
] as const;

export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
      {/* Brand header */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Gamepad2 className="size-4" />
        </div>
        <span className="text-sm font-semibold">NOBILIX</span>
      </div>

      {/* Navigation — platform level only */}
      <nav className="flex-1 space-y-1 p-3" aria-label="Platform navigation">
        {PLATFORM_NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/console"
              ? pathname === "/console"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        Nobilix platform console
      </div>
    </aside>
  );
}
