import { NextRequest, NextResponse } from "next/server";
import { getBoardMarkdown } from "@/lib/board-markdown";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const { markdown, status } = await getBoardMarkdown(boardId, token);

  return new NextResponse(markdown, {
    status,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
