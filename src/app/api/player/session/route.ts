import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthAdmin } from "@/lib/firebase/auth";
import { PLAYER_SESSION_COOKIE } from "@/lib/player-session";
import { checkRateLimit, clientIpFrom, rateLimited } from "@/lib/rate-limit";

const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const MAX_ID_TOKEN_AGE_SECONDS = 5 * 60; // 5 minutes

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ipLimit = await checkRateLimit(
      `player-session-ip:${clientIpFrom(req)}`,
      10,
      60_000,
    );
    if (!ipLimit.allowed) {
      return rateLimited(ipLimit.retryAfterSeconds);
    }

    const body = (await req.json()) as unknown;
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).idToken !== "string"
    ) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }
    const { idToken } = body as { idToken: string };

    // Verify the ID token and enforce recency (auth_time within 5 minutes)
    const auth = getAuthAdmin();
    const decoded = await auth.verifyIdToken(idToken, true);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - decoded.auth_time > MAX_ID_TOKEN_AGE_SECONDS) {
      return NextResponse.json(
        { error: "Token too old — please sign in again" },
        { status: 401 }
      );
    }

    // Per-account cap after the token is verified (uid is trustworthy here).
    const uidLimit = await checkRateLimit(
      `player-session-uid:${decoded.uid}`,
      20,
      60 * 60_000,
    );
    if (!uidLimit.allowed) {
      return rateLimited(uidLimit.retryAfterSeconds);
    }

    // Exchange the ID token for a long-lived session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const isProd = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();
    cookieStore.set(PLAYER_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[player/session POST]", err);
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
}

export async function DELETE(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.set(PLAYER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
