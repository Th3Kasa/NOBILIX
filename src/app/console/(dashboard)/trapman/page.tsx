import {
  Users,
  UserCheck,
  UserPlus,
  Ghost,
  AlertTriangle,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { LiveStatus } from "@/components/console/live-status";
import { getTrapManOverview } from "@/lib/trapman/overview";

export const dynamic = "force-dynamic";

export default async function TrapManOverviewPage() {
  const m = await getTrapManOverview();

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <PageHeader
          title="TrapMan — Mission Control"
          description="Live snapshot of the TrapMan player base."
        />
        <LiveStatus connected={m.connected} className="shrink-0" />
      </div>

      {/* 1. Connection warning */}
      {!m.connected && (
        <Card className="mb-6 border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="font-medium">Not connected to Firebase</p>
              <p className="text-muted-foreground">
                Add the service-account credentials to environment variables to
                see live data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Player health metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total players" value={m.totalPlayers} icon={Users} />
        <StatCard
          label="Registered"
          value={m.registeredPlayers}
          icon={UserCheck}
          hint="Non-guest accounts"
        />
        <StatCard
          label="Guests"
          value={m.guestPlayers}
          icon={Ghost}
        />
        <StatCard
          label="New (7 days)"
          value={m.newPlayers7d}
          icon={UserPlus}
        />
      </div>

      {/* 3. Activity chart region — honest empty state when no data */}
      {!m.connected && (
        <Card className="mb-6">
          <CardContent className="flex min-h-40 items-center justify-center p-6 text-sm text-muted-foreground">
            Activity chart unavailable — Firebase connection required.
          </CardContent>
        </Card>
      )}

      {/* 4. Unavailable data-source panel */}
      {m.unavailable.length > 0 && (
        <Card className="mb-6 border-border/60">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Info className="size-4" aria-hidden="true" />
              Data sources pending verification
            </div>
            <ul className="space-y-1.5">
              {m.unavailable.map((label) => (
                <li
                  key={label}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  {label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
