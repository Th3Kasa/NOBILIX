import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listUsers } from "@/lib/users";
import { listLeaderboard } from "@/lib/leaderboard";
import { recordAudit } from "@/lib/audit";

/**
 * Console data exports — CSV downloads for datasets that are confirmed to
 * have real Firestore-backed data (`users`, `leaderboard`). Purchases is
 * intentionally NOT included here: the `purchases` collection is confirmed
 * to exist but currently holds zero documents (Phase 0 discovery), so there
 * is nothing honest to export yet.
 */

const SUPPORTED_DATASETS = ["users", "leaderboard"] as const;
type Dataset = (typeof SUPPORTED_DATASETS)[number];

function toCsvValue(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const body = rows
    .map((row) => columns.map((col) => toCsvValue(row[col])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dataset } = await params;
  if (!SUPPORTED_DATASETS.includes(dataset as Dataset)) {
    return NextResponse.json(
      { error: `Unsupported dataset "${dataset}". Try: ${SUPPORTED_DATASETS.join(", ")}.` },
      { status: 400 },
    );
  }

  let csv: string;
  let filename: string;

  if (dataset === "users") {
    const result = await listUsers({ limit: 1000 });
    if (!result.connected) {
      return NextResponse.json(
        { error: result.error ?? "Firebase unreachable" },
        { status: 503 },
      );
    }
    const columns = [
      "uid",
      "displayName",
      "email",
      "country",
      "character",
      "level",
      "highScore",
      "isGuest",
      "createdAt",
      "lastSeenAt",
    ];
    csv = toCsv(result.users, columns);
    filename = "trapman-users.csv";
  } else {
    const result = await listLeaderboard(1000, 0);
    if (!result.connected) {
      return NextResponse.json(
        { error: result.error ?? "Firebase unreachable" },
        { status: 503 },
      );
    }
    const columns = ["rank", "uid", "displayName", "country", "character", "score", "updatedAt"];
    csv = toCsv(
      result.entries.map((entry) => ({ ...entry })),
      columns,
    );
    filename = "trapman-leaderboard.csv";
  }

  await recordAudit({
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: "export.download",
    target: dataset,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
