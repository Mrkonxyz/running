import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb.js";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../../../lib/auth.js";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    let sessionId = null;
    if (accessToken) {
      const p = await verifyAccessToken(accessToken);
      if (p?.sessionId) sessionId = p.sessionId;
    }
    if (!sessionId && refreshToken) {
      const p = await verifyRefreshToken(refreshToken);
      if (p?.sessionId) sessionId = p.sessionId;
    }

    if (sessionId) {
      const db = await getDb();
      await db.collection("sessions").updateOne(
        { sessionId },
        { $set: { revokedAt: new Date() } }
      );
    }

    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    console.error("Logout error:", err);
    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response);
    return response;
  }
}
