import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { z } from "zod";
import { getBoardMarkdown } from "./board-markdown";

export function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);
}

export function registerBoardTools(
  server: McpServer,
  context: { boardId: string; shareToken?: string }
) {
  const convex = getConvex();

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

/**
 * Register tools for the per-user authenticated MCP server.
 * Includes list_boards and board-specific tools that take boardId as a parameter.
 */
export function registerUserTools(
  server: McpServer,
  userId: string
) {
  const convex = getConvex();
  const uid = userId as Id<"users">;

  server.tool(
    "list_boards",
    "List all boards you have access to",
    {},
    async () => {
      const boards = await convex.query(api.mcp.getBoardsByUserId, {
        userId: uid,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(boards, null, 2) }],
      };
    }
  );

  server.tool(
    "get_board",
    "Get board info (name, icon, visibility, node count)",
    { board_id: z.string().describe("The board ID to get info for") },
    async ({ board_id }) => {
      const result = await convex.query(api.mcp.getBoardWithNodes, {
        boardId: board_id as Id<"boards">,
        userId: uid,
      });
      if (!result) {
        return {
          content: [{ type: "text", text: "Board not found or not accessible." }],
          isError: true,
        };
      }
      const { board, nodes } = result;
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
                nodeCount: nodes.length,
                createdAt: new Date(board.createdAt).toISOString(),
                updatedAt: new Date(board.updatedAt).toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "list_nodes",
    "List all nodes on a board with their content, type, and metadata",
    { board_id: z.string().describe("The board ID to list nodes for") },
    async ({ board_id }) => {
      const result = await convex.query(api.mcp.getBoardWithNodes, {
        boardId: board_id as Id<"boards">,
        userId: uid,
      });
      if (!result) {
        return {
          content: [{ type: "text", text: "Board not found or not accessible." }],
          isError: true,
        };
      }
      const formatted = result.nodes.map((n) => ({
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
    "Search nodes by content across a board (case-insensitive text match)",
    {
      board_id: z.string().describe("The board ID to search in"),
      query: z.string().describe("Text to search for in node content"),
    },
    async ({ board_id, query }) => {
      const result = await convex.query(api.mcp.getBoardWithNodes, {
        boardId: board_id as Id<"boards">,
        userId: uid,
      });
      if (!result) {
        return {
          content: [{ type: "text", text: "Board not found or not accessible." }],
          isError: true,
        };
      }
      const lower = query.toLowerCase();
      const matches = result.nodes.filter(
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
    "Get a board's full content as formatted markdown",
    { board_id: z.string().describe("The board ID to get markdown for") },
    async ({ board_id }) => {
      // First verify access
      const result = await convex.query(api.mcp.getBoardWithNodes, {
        boardId: board_id as Id<"boards">,
        userId: uid,
      });
      if (!result) {
        return {
          content: [{ type: "text", text: "Board not found or not accessible." }],
          isError: true,
        };
      }
      const { markdown } = await getBoardMarkdown(board_id);
      return {
        content: [{ type: "text", text: markdown }],
      };
    }
  );
}
