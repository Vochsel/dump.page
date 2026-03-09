import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { adminQuery } from "@/lib/convex-server";
import { z } from "zod";
import { formatBoardDataAsMarkdown } from "@/lib/board-markdown";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

const MCP_WRITE_ENABLED = true;

function getAccessToken(authInfo: { extra?: Record<string, unknown> } | undefined): string | undefined {
  return authInfo?.extra?.accessToken as string | undefined;
}

function createServer(): McpServer {
  const server = new McpServer({
    name: "dump-mcp",
    version: "1.0.0",
  });

  // --- list_boards ---
  server.registerTool(
    "list_boards",
    {
      title: "List Boards",
      description:
        "List all boards the authenticated user has access to. Returns board names, slugs, icons, visibility, and item counts.",
      inputSchema: z.object({}),
    },
    async (_args, { authInfo }) => {
      const accessToken = getAccessToken(authInfo);
      if (!accessToken) {
        return {
          content: [
            { type: "text" as const, text: "Error: Not authenticated. Please reconnect." },
          ],
        };
      }

      const boards = await convex.query(api.mcp.listBoards, {
        accessToken,
      });

      if (!boards || boards.length === 0) {
        return {
          content: [{ type: "text" as const, text: "You have no boards yet." }],
        };
      }

      const list = boards
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(
          (b) =>
            `${b.icon} **${b.name}** (slug: \`${b.slug}\`, ${b.nodeCount} items, ${b.visibility}, role: ${b.role})`
        );

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${boards.length} board(s):\n\n${list.join("\n")}`,
          },
        ],
      };
    }
  );

  // --- get_board ---
  server.registerTool(
    "get_board",
    {
      title: "Get Board",
      description:
        "Get the full content of a board as markdown. Use the board slug (the short ID from the URL). Returns all notes, links, and checklists.",
      inputSchema: z.object({
        slug: z.string().describe("Board slug (e.g. 'a1b2c3d4')"),
      }),
    },
    async ({ slug }, { authInfo }) => {
      const accessToken = getAccessToken(authInfo);
      if (!accessToken) {
        return {
          content: [{ type: "text" as const, text: "Error: Not authenticated." }],
        };
      }

      const board = await convex.query(api.mcp.getBoardBySlug, {
        accessToken,
        slug,
      });

      if (!board) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Board not found or you don't have access.",
            },
          ],
        };
      }

      const markdown = formatBoardDataAsMarkdown(board.board, board.nodes, board.edges);

      return {
        content: [{ type: "text" as const, text: markdown }],
      };
    }
  );

  // --- search_boards ---
  server.registerTool(
    "search_boards",
    {
      title: "Search Boards",
      description:
        "Search your boards by name. Returns matching boards with their slugs.",
      inputSchema: z.object({
        query: z.string().describe("Search query to match against board names"),
      }),
    },
    async ({ query }, { authInfo }) => {
      const accessToken = getAccessToken(authInfo);
      if (!accessToken) {
        return {
          content: [{ type: "text" as const, text: "Error: Not authenticated." }],
        };
      }

      const boards = await convex.query(api.mcp.searchBoards, {
        accessToken,
        query,
      });

      if (!boards || boards.length === 0) {
        return {
          content: [
            { type: "text" as const, text: `No boards found matching "${query}".` },
          ],
        };
      }

      const list = boards
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map(
          (b) => `${b.icon} **${b.name}** (slug: \`${b.slug}\`, ${b.visibility})`
        );

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${boards.length} board(s) matching "${query}":\n\n${list.join("\n")}`,
          },
        ],
      };
    }
  );

  // --- search_items ---
  server.registerTool(
    "search_items",
    {
      title: "Search Items",
      description:
        "Search for notes, links, and checklists across your boards. Optionally limit to a specific board by slug.",
      inputSchema: z.object({
        query: z.string().describe("Text to search for in item content, titles, and metadata"),
        board_slug: z
          .string()
          .optional()
          .describe("Optional: limit search to a specific board slug"),
      }),
    },
    async ({ query, board_slug }, { authInfo }) => {
      const accessToken = getAccessToken(authInfo);
      if (!accessToken) {
        return {
          content: [{ type: "text" as const, text: "Error: Not authenticated." }],
        };
      }

      const items = await convex.query(api.mcp.searchItems, {
        accessToken,
        query,
        boardSlug: board_slug,
      });

      if (!items || items.length === 0) {
        return {
          content: [
            { type: "text" as const, text: `No items found matching "${query}".` },
          ],
        };
      }

      const list = items.map((item) => {
        const title =
          item.title || item.metadata?.title || item.content.slice(0, 80);
        return `- [${item.type}] **${title}** (board: ${item.boardName}, slug: \`${item.boardSlug}\`)`;
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${items.length} item(s) matching "${query}":\n\n${list.join("\n")}`,
          },
        ],
      };
    }
  );

  // --- get_item ---
  server.registerTool(
    "get_item",
    {
      title: "Get Item",
      description:
        "Get a specific item from a board by its ID. Returns the item's type, content, title, and metadata.",
      inputSchema: z.object({
        board_slug: z.string().describe("Board slug (e.g. 'a1b2c3d4')"),
        item_id: z.string().describe("The ID of the item to retrieve"),
      }),
    },
    async ({ board_slug, item_id }, { authInfo }) => {
      const accessToken = getAccessToken(authInfo);
      if (!accessToken) {
        return {
          content: [{ type: "text" as const, text: "Error: Not authenticated." }],
        };
      }

      const item = await convex.query(api.mcp.getItem, {
        accessToken,
        boardSlug: board_slug,
        itemId: item_id,
      });

      if (!item) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Item not found, not accessible, or does not belong to this board.",
            },
          ],
        };
      }

      // Format as markdown similar to getItemMarkdown
      let markdown = "";

      if (item.type === "text") {
        if (item.title) markdown += `## ${item.title}\n\n`;
        markdown += `${item.content}\n`;
      } else if (item.type === "checklist") {
        if (item.title) markdown += `## ${item.title}\n\n`;
        try {
          const items = JSON.parse(item.content);
          if (Array.isArray(items)) {
            for (const entry of items) {
              markdown += `- [${entry.checked ? "x" : " "}] ${entry.text}\n`;
            }
          } else {
            markdown += `${item.content}\n`;
          }
        } catch {
          markdown += `${item.content}\n`;
        }
      } else if (item.type === "link") {
        const title = item.metadata?.title || item.content;
        markdown += `- [${title}](${item.content})`;
        if (item.metadata?.description) {
          markdown += ` - ${item.metadata.description}`;
        }
        markdown += "\n";
      } else {
        markdown += `${item.content}\n`;
      }

      markdown += `\n---\n*ID: ${item.id} | Type: ${item.type}*`;

      return {
        content: [{ type: "text" as const, text: markdown }],
      };
    }
  );

  // --- create_note (feature-flagged) ---
  if (MCP_WRITE_ENABLED) {
    server.registerTool(
      "create_note",
      {
        title: "Create Note",
        description:
          "Create a new note on a board. You must be a member of the board. Supports text, link, and checklist types.",
        inputSchema: z.object({
          board_slug: z.string().describe("Slug of the board to add the note to"),
          content: z.string().describe("Content of the note (text, URL for links, or JSON array for checklists)"),
          title: z.string().optional().describe("Optional title for the note"),
          type: z
            .enum(["text", "link", "checklist"])
            .optional()
            .describe("Type of note (default: text)"),
        }),
      },
      async ({ board_slug, content, title, type }, { authInfo }) => {
        const accessToken = getAccessToken(authInfo);
        if (!accessToken) {
          return {
            content: [{ type: "text" as const, text: "Error: Not authenticated." }],
          };
        }

        try {
          const result = await convex.mutation(api.mcp.createNote, {
            accessToken,
            boardSlug: board_slug,
            content,
            title,
            type: type as "text" | "link" | "checklist" | undefined,
          });

          return {
            content: [
              {
                type: "text" as const,
                text: `Note created successfully on board \`${result.boardSlug}\` (id: ${result.id}).`,
              },
            ],
          };
        } catch (e) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error creating note: ${e instanceof Error ? e.message : "Unknown error"}`,
              },
            ],
          };
        }
      }
    );

    // --- add_items (feature-flagged) ---
    server.registerTool(
      "add_items",
      {
        title: "Quick Add Items",
        description:
          "Quickly add one or more items to a board. Each item specifies its type (text, link, or checklist) and content. Items are positioned automatically.",
        inputSchema: z.object({
          board_slug: z.string().describe("Slug of the board to add items to"),
          items: z
            .array(
              z.object({
                type: z
                  .enum(["text", "link", "checklist"])
                  .describe("Type of item"),
                content: z
                  .string()
                  .describe(
                    "Content: plain text/HTML for text, URL for link, JSON array for checklist"
                  ),
                title: z.string().optional().describe("Optional title"),
              })
            )
            .describe("Array of items to add"),
        }),
      },
      async ({ board_slug, items }, { authInfo }) => {
        const accessToken = getAccessToken(authInfo);
        if (!accessToken) {
          return {
            content: [
              { type: "text" as const, text: "Error: Not authenticated." },
            ],
          };
        }

        try {
          const result = await convex.mutation(api.mcp.addItems, {
            accessToken,
            boardSlug: board_slug,
            items,
          });

          return {
            content: [
              {
                type: "text" as const,
                text: `Added ${result.count} item(s) to board \`${result.boardSlug}\` (ids: ${result.ids.join(", ")}).`,
              },
            ],
          };
        } catch (e) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error adding items: ${e instanceof Error ? e.message : "Unknown error"}`,
              },
            ],
          };
        }
      }
    );

    // --- update_note (feature-flagged) ---
    server.registerTool(
      "update_note",
      {
        title: "Update Note",
        description:
          "Update an existing note's content or title. You must be a member of the board containing the note.",
        inputSchema: z.object({
          note_id: z.string().describe("The ID of the note to update"),
          content: z.string().optional().describe("New content for the note"),
          title: z.string().optional().describe("New title for the note"),
        }),
      },
      async ({ note_id, content, title }, { authInfo }) => {
        const accessToken = getAccessToken(authInfo);
        if (!accessToken) {
          return {
            content: [{ type: "text" as const, text: "Error: Not authenticated." }],
          };
        }

        try {
          await convex.mutation(api.mcp.updateNote, {
            accessToken,
            nodeId: note_id as Id<"nodes">,
            content,
            title,
          });

          return {
            content: [
              { type: "text" as const, text: `Note ${note_id} updated successfully.` },
            ],
          };
        } catch (e) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error updating note: ${e instanceof Error ? e.message : "Unknown error"}`,
              },
            ],
          };
        }
      }
    );

    // --- toggle_checklist_item (feature-flagged) ---
    server.registerTool(
      "toggle_checklist_item",
      {
        title: "Toggle Checklist Item",
        description:
          "Toggle a specific checklist item's checked state. Specify the board slug, the checklist node ID, and the zero-based index of the item to toggle.",
        inputSchema: z.object({
          board_slug: z.string().describe("Slug of the board containing the checklist"),
          item_id: z.string().describe("The ID of the checklist node"),
          checklist_index: z
            .number()
            .describe("Zero-based index of the checklist item to toggle"),
        }),
      },
      async ({ board_slug, item_id, checklist_index }, { authInfo }) => {
        const accessToken = getAccessToken(authInfo);
        if (!accessToken) {
          return {
            content: [{ type: "text" as const, text: "Error: Not authenticated." }],
          };
        }

        try {
          const result = await convex.mutation(api.mcp.toggleChecklistItem, {
            accessToken,
            boardSlug: board_slug,
            itemId: item_id,
            checklistIndex: checklist_index,
          });

          const statusEmoji = result.checked ? "[x]" : "[ ]";
          const toggledItem = result.items.find(
            (i: { index: number }) => i.index === result.checklistIndex
          );
          const itemText = toggledItem ? toggledItem.text : "item";

          let response = `Toggled checklist item ${result.checklistIndex}: ${statusEmoji} ${itemText}\n\nFull checklist:\n`;
          for (const item of result.items) {
            response += `- [${item.checked ? "x" : " "}] ${item.text}\n`;
          }

          return {
            content: [{ type: "text" as const, text: response }],
          };
        } catch (e) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error toggling checklist item: ${e instanceof Error ? e.message : "Unknown error"}`,
              },
            ],
          };
        }
      }
    );
  }

  return server;
}

// Auth validation
async function validateAuth(req: Request): Promise<{
  userId: string;
  scope: string;
  accessToken: string;
  user: { name: string; email: string };
} | null> {
  const authHeader = req.headers.get("Authorization");
  const [type, token] = authHeader?.split(" ") || [];
  const bearerToken = type?.toLowerCase() === "bearer" ? token : undefined;

  if (!bearerToken) return null;

  try {
    const tokenInfo = await adminQuery(internal.mcpAuth.validateToken, {
      accessToken: bearerToken,
    });
    if (!tokenInfo) return null;
    return { ...tokenInfo, accessToken: bearerToken };
  } catch (err) {
    console.error("[MCP Auth] validateToken error:", err);
    return null;
  }
}

async function createTransport() {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  await server.connect(transport);
  return transport;
}

const RESOURCE_METADATA_URL = "https://www.dump.page/.well-known/oauth-protected-resource";

function authErrorResponse(message: string) {
  return new Response(
    JSON.stringify({ error: "invalid_token", error_description: message }),
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer error="invalid_token", error_description="${message}", resource_metadata="${RESOURCE_METADATA_URL}"`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function handler(req: Request): Promise<Response> {
  console.log(`[MCP] ${req.method} ${new URL(req.url).pathname}`);

  // Validate auth
  const tokenInfo = await validateAuth(req);
  if (!tokenInfo) {
    return authErrorResponse("No authorization provided");
  }

  const t = await createTransport();

  const authInfo = {
    token: "",
    clientId: "dump-mcp",
    scopes: tokenInfo.scope.split(/[\s,]+/),
    extra: {
      accessToken: tokenInfo.accessToken,
      userId: tokenInfo.userId,
      userName: tokenInfo.user.name,
      userEmail: tokenInfo.user.email,
    },
  };

  try {
    const response = await t.handleRequest(req, { authInfo });
    console.log(`[MCP] Response: ${response.status}`);
    return response;
  } catch (err) {
    console.error("[MCP] handleRequest error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

export { handler as GET, handler as POST, handler as DELETE };
