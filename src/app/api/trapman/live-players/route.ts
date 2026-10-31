import { requireAdmin } from "@/lib/authz";
import { getLivePlayers } from "@/app/console/(dashboard)/trapman/live-players";

/**
 * Polled by the Overview's "Playing right now" card. /api sits outside the
 * proxy's /console matcher, so the session is checked here. Read-only, so
 * viewers may see it too.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const live = await getLivePlayers();
  return Response.json(live, { headers: { "Cache-Control": "private, no-store" } });
}
