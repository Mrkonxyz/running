import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb.js";
import {
  ACCESS_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
  applyAuthCookies,
  clearAuthCookies,
  hashToken,
  serializeSession,
  serializeUser,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../../lib/auth.js";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json({ ok: false, error: "ไม่พบ Refresh Token" }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      const res = NextResponse.json({ ok: false, error: "Refresh Token ไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    const db = await getDb();
    const sessionsCol = db.collection("sessions");
    const usersCol = db.collection("users");
    const now = new Date();
    const currentHash = hashToken(refreshToken);

    const sessionDoc = await sessionsCol.findOne({
      sessionId: payload.sessionId,
      email: payload.email,
      refreshTokenHash: currentHash,
      revokedAt: null,
      expiresAt: { $gt: now },
    });

    if (!sessionDoc) {
      const res = NextResponse.json({ ok: false, error: "Session ถูกยกเลิกหรือหมดอายุแล้ว" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    const userDoc = await usersCol.findOne({ email: payload.email });
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "ไม่พบข้อมูลผู้ใช้" }, { status: 401 });
    }

    const userId = String(userDoc._id);
    const newJti = crypto.randomUUID();
    const newAccessToken = await signAccessToken({
      userId,
      email: userDoc.email,
      sessionId: sessionDoc.sessionId,
    });
    const newRefreshToken = await signRefreshToken({
      userId,
      email: userDoc.email,
      sessionId: sessionDoc.sessionId,
      jti: newJti,
    });

    await sessionsCol.updateOne(
      { sessionId: sessionDoc.sessionId },
      {
        $set: {
          refreshTokenHash: hashToken(newRefreshToken),
          lastRefreshedAt: now,
        },
      }
    );

    const updatedSession = { ...sessionDoc, lastRefreshedAt: now };
    const response = NextResponse.json({
      ok: true,
      user: serializeUser(userDoc),
      session: serializeSession(
        updatedSession,
        new Date(now.getTime() + ACCESS_TTL_SECONDS * 1000).toISOString()
      ),
    });

    applyAuthCookies(response, newAccessToken, newRefreshToken);
    return response;
  } catch (err) {
    console.error("Refresh token error:", err);
    return NextResponse.json({ ok: false, error: "ไม่สามารถต่ออายุ Refresh Token ได้" }, { status: 500 });
  }
}
