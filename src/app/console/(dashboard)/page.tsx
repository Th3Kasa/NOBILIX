import {
  Users,
  UserCheck,
  UserPlus,
  Ghost,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { getOverviewMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const m = await getOverviewMetrics();

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live snapshot of the TrapMan player base."
      />

      {!m.connected && (
        <Card className="mb-6 border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="font-medium">Not connected to Firebase yet</p>
              <p className="text-muted-foreground">
                Add the service-account credentials to environment variables to
                see live data. (Phase 0 discovery confirms the exact schema.)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total players" value={m.totalUsers} icon={Users} />
        <StatCard
          label="Registered"
          value={m.registeredUsers}
          icon={UserCheck}
          hint="Non-guest accounts"
        />
        <StatCard label="Guests" value={m.guestUsers} icon={Ghost} />
        <StatCard
          label="New (7 days)"
          value={m.newUsers7d}
          icon={UserPlus}
        />
      </div>
    </>
  );
}
