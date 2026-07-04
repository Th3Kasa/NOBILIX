import { NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/authz";
import { buildUserExport } from "@/lib/users";
import { recordAudit } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  // Per-player data export is a write-level privilege (same policy as the
  // bulk CSV exports): viewer-role admins must not download player data.
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (err) {
    const readOnly = err instanceof Error && err.message.includes("read-only");
    return NextResponse.json(
      { error: readOnly ? "Exports require write access." : "Unauthorized" },
      { status: readOnly ? 403 : 401 },
    );
  }

  const { uid } = await params;
  const data = await buildUserExport(uid);
  if (!data) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "user.export",
    target: uid,
  });

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), player: data },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="player-${uid}.json"`,
    },
  });
}
