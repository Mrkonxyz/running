import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb.js";
import { getMergedPlansForUser } from "../../../lib/plans-store.js";
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
    const plans = await getMergedPlansForUser(resolved.user.email, db);

    const response = NextResponse.json({ ok: true, plans });
    if (resolved.refreshedAccessToken) {
      response.cookies.set(
        ACCESS_COOKIE_NAME,
        resolved.refreshedAccessToken,
        getCookieOptions(ACCESS_TTL_SECONDS)
      );
    }
    return response;
  } catch (err) {
    console.error("GET /api/plans error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load plans" }, { status: 500 });
  }
}
