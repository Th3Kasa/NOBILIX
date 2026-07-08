import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PlatformSidebar } from "@/components/nav/platform-sidebar";
import { Topbar } from "@/components/nav/topbar";
import { ConsoleMobileNav } from "@/components/nav/console-mobile-nav";
import { CommandPalette } from "@/components/console/command-palette";

// Belt-and-braces with robots.ts: the operator console must never be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const platformNavigationItems = [
  { href: "/console", label: "Projects", description: "All Nobilix projects" },
  { href: "/console/trapman", label: "TrapMan", description: "Main project" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/console/login");

  return (
    <div className="console-shell flex min-h-dvh">
      <div className="console-grid-mesh" aria-hidden="true" />
      <PlatformSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border bg-card/40 px-4 py-3 md:hidden">
          <ConsoleMobileNav scopeLabel="Platform" items={platformNavigationItems} />
        </div>
        <Topbar
          name={session.user.name ?? ""}
          email={session.user.email ?? ""}
          role={session.user.role}
        />
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
      <CommandPalette />
    </div>
  );
}
