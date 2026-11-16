import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, getCookieOptions, ACCESS_TTL_SECONDS, resolveSessionFromCookies } from "../../../../lib/auth.js";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const resolved = await resolveSessionFromCookies(cookieStore);

    if (!resolved) {
      return NextResponse.json({ authenticated: false, user: null, session: null });
    }

    const response = NextResponse.json({
      authenticated: true,
      user: resolved.user,
      session: resolved.session,
      autoRefreshed: Boolean(resolved.rotatedAccessToken),
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
    console.error("Session check error:", err);
    return NextResponse.json({ authenticated: false, user: null, error: "Database error" }, { status: 500 });
  }
}
