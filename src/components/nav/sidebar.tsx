"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Send,
  BarChart3,
  ShoppingCart,
  FileDown,
  ScrollText,
  Gamepad2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/console", label: "Overview", icon: LayoutDashboard },
  { href: "/console/users", label: "Players", icon: Users },
  { href: "/console/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/console/messaging", label: "Push notifications", icon: Send },
  { href: "/console/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/console/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/console/exports", label: "Exports", icon: FileDown },
  { href: "/console/audit", label: "Audit log", icon: ScrollText },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Gamepad2 className="size-4" />
        </div>
        <span className="text-sm font-semibold">NOBILIX</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/console"
              ? pathname === "/console"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        TrapMan backend console
      </div>
    </aside>
  );
}
