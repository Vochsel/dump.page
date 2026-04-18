import { NextResponse } from "next/server";
import { getBoardSkill } from "./board-markdown";
import { getBoardUrl, getSharedBoardPathUrl } from "./board-url";

function getBoardSkillSourceUrl(boardId: string, shareToken?: string): string {
  if (shareToken) {
    return getSharedBoardPathUrl(boardId, shareToken);
  }

  return getBoardUrl(boardId, { absolute: true });
}

export async function getBoardSkillManifest(
  boardId: string,
  shareToken?: string
): Promise<{
  body: { skills: Array<{ name: string; description: string; files: string[] }> };
  status: number;
}> {
  const boardUrl = getBoardSkillSourceUrl(boardId, shareToken);
  const result = await getBoardSkill(boardId, shareToken, { boardUrl });

  if (result.status !== 200 || !result.skillName || !result.description) {
    return {
      body: { skills: [] },
      status: result.status,
    };
  }

  return {
    body: {
      skills: [
        {
          name: result.skillName,
          description: result.description,
          files: ["SKILL.md"],
        },
      ],
    },
    status: 200,
  };
}

export async function getBoardSkillMarkdownResponse(
  boardId: string,
  requestedSkillName: string,
  shareToken?: string
): Promise<NextResponse> {
  const boardUrl = getBoardSkillSourceUrl(boardId, shareToken);
  const result = await getBoardSkill(boardId, shareToken, { boardUrl });

  if (result.status !== 200 || !result.skillName || result.skillName !== requestedSkillName) {
    const status = result.status === 200 ? 404 : result.status;
    const body =
      status === 404
        ? "# Skill Not Found\n\nThis skill does not exist for this board."
        : result.markdown;

    return new NextResponse(body, {
      status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(result.markdown, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
