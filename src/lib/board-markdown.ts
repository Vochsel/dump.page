import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import TurndownService from "turndown";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

function contentToMarkdown(content: string): string {
  if (!content) return "";
  // If content looks like HTML, convert to markdown
  if (content.trimStart().startsWith("<")) {
    return turndown.turndown(content);
  }
  return content;
}

export async function getBoardMarkdown(
  boardId: string,
  shareToken?: string
): Promise<{ markdown: string; status: number }> {
  try {
    const result = await convex.query(api.boards.getBoardForMarkdown, {
      boardId: boardId as Id<"boards">,
      shareToken,
    });

    if (!result) {
      return {
        markdown: "# Board Not Found\n\nThis board is private or does not exist.",
        status: 404,
      };
    }

    const { board, nodes } = result;

    let markdown = `# ${board.icon} ${board.name}\n\n`;

    const textNodes = nodes.filter((n) => n.type === "text");
    const linkNodes = nodes.filter((n) => n.type === "link");

    if (textNodes.length > 0) {
      markdown += `## Notes\n\n`;
      for (const node of textNodes) {
        markdown += `${contentToMarkdown(node.content)}\n\n`;
      }
    }

    if (linkNodes.length > 0) {
      markdown += `## Links\n\n`;
      for (const node of linkNodes) {
        const title = node.metadata?.title || node.content;
        markdown += `- [${title}](${node.content})`;
        if (node.metadata?.description) {
          markdown += ` - ${node.metadata.description}`;
        }
        markdown += `\n`;
      }
    }

    if (nodes.length === 0) {
      markdown += `*This board is empty.*\n`;
    }

    return { markdown, status: 200 };
  } catch {
    return {
      markdown: "# Error\n\nFailed to load board.",
      status: 500,
    };
  }
}
