import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthAdmin } from "@/lib/firebase/auth";
import { PLAYER_SESSION_COOKIE } from "@/lib/player-session";
import { deletePlayerAccount } from "@/lib/player-deletion";

const REQUIRED_CONFIRMATION = "DELETE TRAPMAN";
const MAX_AUTH_AGE_SECONDS = 5 * 60; // 5 minutes

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify the session cookie with revocation checking
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(PLAYER_SESSION_COOKIE)?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const auth = getAuthAdmin();
    let decoded: Awaited<ReturnType<typeof auth.verifySessionCookie>>;
    try {
      // true = checkRevoked: reject revoked tokens
      decoded = await auth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json(
        { error: "Session invalid or revoked. Please sign in again." },
        { status: 401 }
      );
    }

    // 2. Enforce recent authentication: auth_time must be within 5 minutes
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - decoded.auth_time > MAX_AUTH_AGE_SECONDS) {
      return NextResponse.json(
        {
          error:
            "Account deletion requires recent authentication. Please sign in again and retry within 5 minutes.",
        },
        { status: 401 }
      );
    }

    // 3. Validate request body — only confirmation string accepted; uid never from body
    const body = (await req.json()) as unknown;
    if (
      typeof body !== "object" ||
      body === null ||
      (body as Record<string, unknown>).confirmation !== REQUIRED_CONFIRMATION
    ) {
      return NextResponse.json(
        {
          error: `Confirmation required. Send { "confirmation": "${REQUIRED_CONFIRMATION}" }.`,
        },
        { status: 400 }
      );
    }

    // 4. uid comes exclusively from the verified session cookie
    const uid = decoded.uid;

    // 5. Execute idempotent deletion
    const result = await deletePlayerAccount(uid);

    // 6. Clear the session cookie
    cookieStore.set(PLAYER_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      anonymized: result.anonymized,
      alreadyAbsent: result.alreadyAbsent,
    });
  } catch (err) {
    console.error("[player/delete POST]", err);
    return NextResponse.json(
      {
        error:
          "Deletion failed. Please try again or contact help.nobilix@outlook.com.",
      },
      { status: 500 }
    );
  }
}
