import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { z } from "zod";
import { getBoardMarkdown } from "./board-markdown";

export function registerBoardTools(
  server: McpServer,
  context: { boardId: string; shareToken?: string }
) {
  const convex = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL as string
  );

  const boardId = context.boardId as Id<"boards">;
  const shareToken = context.shareToken;

  async function fetchBoardAndNodes() {
    const result = await convex.query(api.boards.getBoardForMarkdown, {
      boardId,
      shareToken,
    });
    if (!result) {
      throw new Error(
        "Board not found or not accessible. Check the board ID and token."
      );
    }
    return result;
  }

  server.tool("get_board", "Get board info (name, icon, visibility)", {}, async () => {
    const { board } = await fetchBoardAndNodes();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              id: board._id,
              name: board.name,
              icon: board.icon,
              visibility: board.visibility,
              createdAt: new Date(board.createdAt).toISOString(),
              updatedAt: new Date(board.updatedAt).toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  });

  server.tool(
    "list_nodes",
    "List all nodes on the board with their content, type, and metadata",
    {},
    async () => {
      const { nodes } = await fetchBoardAndNodes();
      const formatted = nodes.map((n) => ({
        id: n._id,
        type: n.type,
        content: n.content,
        metadata: n.metadata,
        position: n.position,
        createdAt: new Date(n.createdAt).toISOString(),
        updatedAt: new Date(n.updatedAt).toISOString(),
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(formatted, null, 2) }],
      };
    }
  );

  server.tool(
    "search_nodes",
    "Search nodes by content (case-insensitive text match)",
    { query: z.string().describe("Text to search for in node content") },
    async ({ query }) => {
      const { nodes } = await fetchBoardAndNodes();
      const lower = query.toLowerCase();
      const matches = nodes.filter(
        (n) =>
          n.content.toLowerCase().includes(lower) ||
          n.metadata?.title?.toLowerCase().includes(lower) ||
          n.metadata?.description?.toLowerCase().includes(lower)
      );
      const formatted = matches.map((n) => ({
        id: n._id,
        type: n.type,
        content: n.content,
        metadata: n.metadata,
      }));
      return {
        content: [
          {
            type: "text",
            text:
              matches.length > 0
                ? JSON.stringify(formatted, null, 2)
                : `No nodes found matching "${query}"`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_board_markdown",
    "Get the full board content as formatted markdown",
    {},
    async () => {
      const { markdown } = await getBoardMarkdown(
        context.boardId,
        context.shareToken
      );
      return {
        content: [{ type: "text", text: markdown }],
      };
    }
  );
}
