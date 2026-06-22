import { NextResponse } from "next/server";
import { getPlayerSession } from "@/lib/player-session";
import { getPlayerAccountSnapshot } from "@/lib/player-account";

export async function GET(): Promise<NextResponse> {
  // uid comes exclusively from the verified session cookie — never from query params.
  const session = await getPlayerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const snapshot = await getPlayerAccountSnapshot(session.uid);

  const exportData = {
    exportedAt: new Date().toISOString(),
    project: "trapman",
    account: {
      username: snapshot.username,
      email: snapshot.email,
      country: snapshot.country,
      competitionsWon: snapshot.competitionsWon,
      analytics: snapshot.analytics,
    },
    progress: snapshot.progress ?? {},
    purchases: snapshot.purchases,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="trapman-data.json"',
    },
  });
}
