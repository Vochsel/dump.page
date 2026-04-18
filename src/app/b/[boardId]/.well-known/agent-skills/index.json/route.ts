import { NextRequest, NextResponse } from "next/server";
import { getBoardSkillManifest } from "@/lib/board-skill";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const result = await getBoardSkillManifest(boardId, token);

  return NextResponse.json(result.body, {
    status: result.status,
  });
}
