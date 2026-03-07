import { NextRequest, NextResponse } from "next/server";
import { getItemMarkdown } from "@/lib/board-markdown";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; itemId: string }> }
) {
  const { boardId, itemId } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const { markdown, status } = await getItemMarkdown(boardId, itemId, token);

  return new NextResponse(markdown, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
