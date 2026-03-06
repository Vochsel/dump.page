import { NextRequest, NextResponse } from "next/server";
import { getBoardRss } from "@/lib/board-rss";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const { xml, status } = await getBoardRss(boardId, token, baseUrl);

  return new NextResponse(xml, {
    status,
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
