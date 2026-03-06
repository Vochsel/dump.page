import { createMcpHandler } from "mcp-handler";
import { registerBoardTools } from "@/lib/mcp-tools";
import { NextRequest } from "next/server";

// Cache handlers by boardId+token to reuse across requests in the same
// serverless invocation (helps SSE which needs GET then POST on same session).
const handlerCache = new Map<
  string,
  (request: Request) => Promise<Response>
>();

function getOrCreateHandler(boardId: string, shareToken?: string) {
  const key = `${boardId}:${shareToken ?? ""}`;
  let handler = handlerCache.get(key);
  if (!handler) {
    handler = createMcpHandler(
      (server) => {
        registerBoardTools(server, { boardId, shareToken });
      },
      {
        serverInfo: {
          name: "magpai",
          version: "1.0.0",
        },
      },
      {
        basePath: `/api/mcp/b/${boardId}`,
        maxDuration: 60,
      }
    );
    handlerCache.set(key, handler);
  }
  return handler;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const handler = getOrCreateHandler(boardId, token);
  return handler(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const handler = getOrCreateHandler(boardId, token);
  return handler(request);
}
