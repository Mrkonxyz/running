import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb.js";
import {
  MCP_SERVER_INFO,
  MCP_TOOLS,
  authenticateMcpRequest,
  executeMcpTool,
} from "../../../lib/mcp.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-MCP-Token, Mcp-Session-Id",
};

function rpcResult(id, result) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request) {
  try {
    const db = await getDb();
    const auth = await authenticateMcpRequest(request, db);
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized — please log in to Training Hub and generate an MCP key first." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        server: MCP_SERVER_INFO,
        user: auth.email,
        transport: "streamable-http",
        tools: MCP_TOOLS,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("GET /api/mcp error:", err);
    return NextResponse.json({ ok: false, error: "MCP server error" }, { status: 500, headers: CORS_HEADERS });
  }
}

async function handleJsonRpcMessage(msg, email) {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return rpcError(msg?.id, -32600, "Invalid Request");
  }

  const { id, method, params } = msg;

  // Notifications have no id and expect no body response (handled cleanly)
  if (method.startsWith("notifications/")) {
    return null;
  }

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: params?.protocolVersion || "2024-11-05",
      capabilities: {
        tools: { listChanged: true },
      },
      serverInfo: MCP_SERVER_INFO,
    });
  }

  if (method === "ping") {
    return rpcResult(id, {});
  }

  if (method === "tools/list") {
    return rpcResult(id, { tools: MCP_TOOLS });
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};
    if (!toolName || typeof toolName !== "string") {
      return rpcError(id, -32602, "Missing tool name");
    }
    try {
      const output = await executeMcpTool(toolName, args, email);
      return rpcResult(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2),
          },
        ],
      });
    } catch (toolErr) {
      return rpcResult(id, {
        isError: true,
        content: [
          {
            type: "text",
            text: toolErr?.message || "Tool execution failed",
          },
        ],
      });
    }
  }

  return rpcError(id, -32601, `Method not found: ${method}`);
}

export async function POST(request) {
  try {
    const db = await getDb();
    const auth = await authenticateMcpRequest(request, db);
    if (!auth) {
      return NextResponse.json(
        rpcError(null, -32001, "Unauthorized: log in to Training Hub and click Connect MCP to obtain a Bearer token."),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        rpcError(null, -32700, "Parse error"),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (Array.isArray(payload)) {
      const results = [];
      for (const item of payload) {
        const res = await handleJsonRpcMessage(item, auth.email);
        if (res) results.push(res);
      }
      if (results.length === 0) {
        return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
      }
      return NextResponse.json(results, { headers: CORS_HEADERS });
    }

    const singleResult = await handleJsonRpcMessage(payload, auth.email);
    if (!singleResult) {
      return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
    }
    return NextResponse.json(singleResult, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("POST /api/mcp error:", err);
    return NextResponse.json(
      rpcError(null, -32603, "Internal MCP server error"),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
