import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PlatformSidebar } from "@/components/nav/platform-sidebar";
import { Topbar } from "@/components/nav/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/console/login");

  return (
    <div className="flex min-h-dvh">
      <PlatformSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={session.user.name ?? ""}
          email={session.user.email ?? ""}
          role={session.user.role}
        />
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
