import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listLeaderboard } from "@/lib/leaderboard";
import { recordAudit } from "@/lib/audit";
import { getPurchasesData } from "@/app/console/(dashboard)/trapman/purchases/data";
import { listPlayers } from "@/app/console/(dashboard)/trapman/users/data";

/**
 * Console data exports — CSV downloads for datasets confirmed to have real
 * Firestore-backed data: `users`, `leaderboard`, and `purchases` (embedded
 * purchase records aggregated from users/{uid}.purchases, confirmed by
 * engineering schema review).
 */

const SUPPORTED_DATASETS = ["users", "leaderboard", "purchases"] as const;
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

  if (dataset === "purchases") {
    const result = await getPurchasesData();
    if (!result.connected) {
      return NextResponse.json(
        { error: result.error ?? "Firebase unreachable" },
        { status: 503 },
      );
    }
    const columns = [
      "purchaseId",
      "productId",
      "price",
      "currency",
      "platform",
      "buyerUid",
      "buyerName",
      "timestamp",
    ];
    csv = toCsv(
      result.purchases.map((p) => ({ ...p })),
      columns,
    );
    filename = "trapman-purchases.csv";
  } else if (dataset === "users") {
    const result = await listPlayers({ limit: 1000 });
    if (!result.connected) {
      return NextResponse.json(
        { error: result.error ?? "Firebase unreachable" },
        { status: 503 },
      );
    }
    const columns = [
      "uid",
      "username",
      "email",
      "country",
      "isGuest",
      "currentLevel",
      "completedLevels",
      "purchaseCount",
      "pushReachable",
    ];
    csv = toCsv(
      result.players.map((p) => ({ ...p })),
      columns,
    );
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
