import { NextRequest } from "next/server";
import { getBoardSkillMarkdownResponse } from "@/lib/board-skill";

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ boardId: string; skillName: string }> }
) {
  const { boardId, skillName } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  return getBoardSkillMarkdownResponse(boardId, skillName, token);
}
