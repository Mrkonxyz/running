import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb.js";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_TTL_SECONDS,
  getCookieOptions,
  resolveSessionFromCookies,
} from "../../../../lib/auth.js";
import {
  MCP_TOOLS,
  createUserMcpToken,
  getActiveMcpTokenMeta,
  revokeUserMcpTokens,
} from "../../../../lib/mcp.js";

function resolvePublicOrigin(request) {
  const fwdHost = request.headers.get("x-forwarded-host");
  const host = fwdHost || request.headers.get("host");
  const fwdProto = request.headers.get("x-forwarded-proto");
  const proto = fwdProto || (host && !host.startsWith("127.") && !host.startsWith("localhost") ? "https" : "http");
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

function buildMcpClientConfig(endpointUrl, tokenPlaceholderOrValue) {
  return {
    mcpServers: {
      "training-hub": {
        url: endpointUrl,
        headers: {
          Authorization: `Bearer ${tokenPlaceholderOrValue}`,
        },
      },
    },
  };
}

function attachRefreshedCookie(response, resolved) {
  if (resolved?.refreshedAccessToken) {
    response.cookies.set(
      ACCESS_COOKIE_NAME,
      resolved.refreshedAccessToken,
      getCookieOptions(ACCESS_TTL_SECONDS)
    );
  }
  return response;
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const resolved = await resolveSessionFromCookies(cookieStore);
    if (!resolved) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const meta = await getActiveMcpTokenMeta(resolved.user.email, db);
    const endpointUrl = `${resolvePublicOrigin(request)}/api/mcp`;

    const response = NextResponse.json({
      ok: true,
      ...meta,
      endpointUrl,
      tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
    });
    return attachRefreshedCookie(response, resolved);
  } catch (err) {
    console.error("GET /api/mcp/connect error:", err);
    return NextResponse.json({ ok: false, error: "Failed to check MCP connection" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const resolved = await resolveSessionFromCookies(cookieStore);
    if (!resolved) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    let label = "AI Assistant MCP";
    try {
      const body = await request.json();
      if (body?.label) label = String(body.label);
    } catch {
      // empty body ok
    }

    const db = await getDb();
    const { rawToken, meta } = await createUserMcpToken(resolved.user.email, label, db);
    const endpointUrl = `${resolvePublicOrigin(request)}/api/mcp`;

    const response = NextResponse.json({
      ok: true,
      ...meta,
      token: rawToken,
      endpointUrl,
      mcpConfig: buildMcpClientConfig(endpointUrl, rawToken),
      tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
    });
    return attachRefreshedCookie(response, resolved);
  } catch (err) {
    console.error("POST /api/mcp/connect error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create MCP connection" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const resolved = await resolveSessionFromCookies(cookieStore);
    if (!resolved) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    await revokeUserMcpTokens(resolved.user.email, db);
    const response = NextResponse.json({ ok: true, connected: false });
    return attachRefreshedCookie(response, resolved);
  } catch (err) {
    console.error("DELETE /api/mcp/connect error:", err);
    return NextResponse.json({ ok: false, error: "Failed to disconnect MCP" }, { status: 500 });
  }
}
