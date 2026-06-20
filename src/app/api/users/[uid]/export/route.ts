import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildUserExport } from "@/lib/users";
import { recordAudit } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uid } = await params;
  const data = await buildUserExport(uid);
  if (!data) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  await recordAudit({
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
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
