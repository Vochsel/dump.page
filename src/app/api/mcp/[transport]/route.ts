import { createMcpHandler } from "mcp-handler";
import { registerUserTools } from "@/lib/mcp-tools";
import { verifyAccessToken } from "@/lib/oauth";
import { NextRequest, NextResponse } from "next/server";

// Cache handlers by userId for session reuse within serverless invocations
const handlerCache = new Map<
  string,
  (request: Request) => Promise<Response>
>();

function getOrCreateHandler(userId: string) {
  let handler = handlerCache.get(userId);
  if (!handler) {
    handler = createMcpHandler(
      (server) => {
        registerUserTools(server, userId);
      },
      {
        serverInfo: {
          name: "magpai",
          version: "1.0.0",
        },
      },
      {
        basePath: "/api/mcp",
        maxDuration: 60,
      }
    );
    handlerCache.set(userId, handler);
  }
  return handler;
}

async function extractUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const result = await verifyAccessToken(token);
  return result?.userId ?? null;
}

function unauthorizedResponse(request: NextRequest) {
  const origin = request.nextUrl.origin;
  return new NextResponse(
    JSON.stringify({ error: "unauthorized" }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const userId = await extractUserId(request);
  if (!userId) return unauthorizedResponse(request);
  const handler = getOrCreateHandler(userId);
  return handler(request);
}

export async function POST(request: NextRequest) {
  const userId = await extractUserId(request);
  if (!userId) return unauthorizedResponse(request);
  const handler = getOrCreateHandler(userId);
  return handler(request);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
