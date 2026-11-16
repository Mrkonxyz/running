import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb.js";
import {
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  applyAuthCookies,
  hashToken,
  serializeSession,
  serializeUser,
  signAccessToken,
  signRefreshToken,
} from "../../../../lib/auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
      return NextResponse.json(
        { ok: false, error: "กรุณากรอกรูปแบบอีเมลให้ถูกต้อง" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCol = db.collection("users");
    const sessionsCol = db.collection("sessions");
    const now = new Date();
    const displayName = rawEmail.split("@")[0];

    await usersCol.updateOne(
      { email: rawEmail },
      {
        $set: { lastLoginAt: now },
        $setOnInsert: {
          email: rawEmail,
          displayName,
          createdAt: now,
        },
      },
      { upsert: true }
    );

    const userDoc = await usersCol.findOne({ email: rawEmail });
    const userId = String(userDoc._id);
    const sessionId = crypto.randomUUID();
    const jti = crypto.randomUUID();

    const accessToken = await signAccessToken({ userId, email: rawEmail, sessionId });
    const refreshToken = await signRefreshToken({ userId, email: rawEmail, sessionId, jti });

    const sessionDoc = {
      sessionId,
      userId,
      email: rawEmail,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: request.headers.get("user-agent") || "unknown",
      createdAt: now,
      lastRefreshedAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_TTL_SECONDS * 1000),
      revokedAt: null,
    };

    await sessionsCol.insertOne(sessionDoc);

    const response = NextResponse.json({
      ok: true,
      user: serializeUser(userDoc),
      session: serializeSession(
        sessionDoc,
        new Date(now.getTime() + ACCESS_TTL_SECONDS * 1000).toISOString()
      ),
    });

    applyAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { ok: false, error: "ไม่สามารถเข้าสู่ระบบหรือเชื่อมต่อฐานข้อมูล MongoDB ได้" },
      { status: 500 }
    );
  }
}
