import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb.js";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_TTL_SECONDS,
  getCookieOptions,
  resolveSessionFromCookies,
} from "../../../lib/auth.js";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const resolved = await resolveSessionFromCookies(cookieStore);
    if (!resolved) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const [progressDocs, plansCount] = await Promise.all([
      db.collection("user_progress").find({ email: resolved.user.email }).toArray(),
      db.collection("plans").countDocuments(),
    ]);

    const progressByPlan = {};
    for (const doc of progressDocs) {
      progressByPlan[doc.planId] = doc.completedDays || {};
    }

    const response = NextResponse.json({
      ok: true,
      progressByPlan,
      plansCount,
    });

    if (resolved.rotatedAccessToken) {
      response.cookies.set(
        ACCESS_COOKIE_NAME,
        resolved.rotatedAccessToken,
        getCookieOptions(ACCESS_TTL_SECONDS)
      );
    }

    return response;
  } catch (err) {
    console.error("GET /api/progress error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load progress" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const resolved = await resolveSessionFromCookies(cookieStore);
    if (!resolved) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planId = typeof body?.planId === "string" ? body.planId.trim() : "";
    const completedDays =
      body?.completedDays && typeof body.completedDays === "object" && !Array.isArray(body.completedDays)
        ? body.completedDays
        : null;

    if (!planId || !completedDays) {
      return NextResponse.json({ ok: false, error: "Invalid planId or completedDays payload" }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    await db.collection("user_progress").updateOne(
      { email: resolved.user.email, planId },
      {
        $set: {
          email: resolved.user.email,
          userId: resolved.user.id,
          planId,
          completedDays,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    const response = NextResponse.json({ ok: true, updatedAt: now.toISOString() });

    if (resolved.rotatedAccessToken) {
      response.cookies.set(
        ACCESS_COOKIE_NAME,
        resolved.rotatedAccessToken,
        getCookieOptions(ACCESS_TTL_SECONDS)
      );
    }

    return response;
  } catch (err) {
    console.error("PUT /api/progress error:", err);
    return NextResponse.json({ ok: false, error: "Failed to save progress" }, { status: 500 });
  }
}
