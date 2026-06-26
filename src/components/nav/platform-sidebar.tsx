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
      <div className="console-sidebar-brand">
        <div className="console-sidebar-brand__icon">
          <Gamepad2 className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold tracking-widest text-foreground">NOBILIX</p>
          <p className="text-[10px] leading-tight text-muted-foreground">Platform console</p>
        </div>
        <span className="console-sidebar-brand__live" aria-label="Live" />
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
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-transform duration-150",
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
