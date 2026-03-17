import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { adminQuery } from "@/lib/convex-server";
import { z } from "zod";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

const MCP_WRITE_ENABLED = true;

function jsonResponse(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

function parseChecklist(content: string): unknown {
  try {
    const items = JSON.parse(content);
    if (Array.isArray(items)) return items;
  } catch {}
  return content;
}

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
        "List all boards the authenticated user has access to. Returns JSON array of boards with IDs, slugs, names, icons, visibility, and item counts.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
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
        return jsonResponse([]);
      }

      return jsonResponse(
        boards
          .filter((b): b is NonNullable<typeof b> => b !== null)
          .map((b) => ({
            id: b.id,
            slug: b.slug,
            name: b.name,
            icon: b.icon,
            nodeCount: b.nodeCount,
            visibility: b.visibility,
            role: b.role,
          }))
      );
    }
  );

  // --- get_board ---
  server.registerTool(
    "get_board",
    {
      title: "Get Board",
      description:
        "Get the full content of a board as JSON. Use the board slug (the short ID from the URL). Returns all notes, links, and checklists with their IDs.",
      inputSchema: z.object({
        slug: z.string().describe("Board slug (e.g. 'a1b2c3d4')"),
      }),
      annotations: { readOnlyHint: true },
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

      return jsonResponse({
        board: board.board,
        nodes: board.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          content: n.type === "checklist" ? parseChecklist(n.content) : n.content,
          metadata: n.metadata,
        })),
        edges: board.edges,
      });
    }
  );

  // --- search_boards ---
  server.registerTool(
    "search_boards",
    {
      title: "Search Boards",
      description:
        "Search your boards by name. Returns JSON array of matching boards with IDs and slugs.",
      inputSchema: z.object({
        query: z.string().describe("Search query to match against board names"),
      }),
      annotations: { readOnlyHint: true },
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
        return jsonResponse([]);
      }

      return jsonResponse(
        boards
          .filter((b): b is NonNullable<typeof b> => b !== null)
          .map((b) => ({
            id: b.id,
            slug: b.slug,
            name: b.name,
            icon: b.icon,
            visibility: b.visibility,
          }))
      );
    }
  );

  // --- search_items ---
  server.registerTool(
    "search_items",
    {
      title: "Search Items",
      description:
        "Search for notes, links, and checklists across your boards. Returns JSON array of items with IDs. Optionally limit to a specific board by slug.",
      inputSchema: z.object({
        query: z.string().describe("Text to search for in item content, titles, and metadata"),
        board_slug: z
          .string()
          .optional()
          .describe("Optional: limit search to a specific board slug"),
      }),
      annotations: { readOnlyHint: true },
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
        return jsonResponse([]);
      }

      return jsonResponse(
        items.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title || item.metadata?.title || null,
          content: item.type === "checklist" ? parseChecklist(item.content) : item.content,
          boardSlug: item.boardSlug,
          boardName: item.boardName,
        }))
      );
    }
  );

  // --- get_item ---
  server.registerTool(
    "get_item",
    {
      title: "Get Item",
      description:
        "Get a specific item from a board by its ID. Returns JSON with the item's ID, type, content (checklist items include IDs), title, and metadata.",
      inputSchema: z.object({
        board_slug: z.string().describe("Board slug (e.g. 'a1b2c3d4')"),
        item_id: z.string().describe("The ID of the item to retrieve"),
      }),
      annotations: { readOnlyHint: true },
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

      return jsonResponse({
        id: item.id,
        type: item.type,
        title: item.title || null,
        content: item.type === "checklist" ? parseChecklist(item.content) : item.content,
        metadata: item.metadata || null,
      });
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
        annotations: { destructiveHint: false },
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
        annotations: { destructiveHint: false },
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
        annotations: { destructiveHint: false },
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
          "Toggle a specific checklist item's checked state. Use checklist_item_id (preferred) to target by the item's unique ID, or checklist_index as a fallback.",
        inputSchema: z.object({
          board_slug: z.string().describe("Slug of the board containing the checklist"),
          item_id: z.string().describe("The ID of the checklist node"),
          checklist_item_id: z
            .string()
            .optional()
            .describe("The unique ID of the checklist item to toggle (preferred)"),
          checklist_index: z
            .number()
            .optional()
            .describe("Zero-based index of the checklist item to toggle (fallback)"),
        }),
        annotations: { destructiveHint: false },
      },
      async ({ board_slug, item_id, checklist_item_id, checklist_index }, { authInfo }) => {
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
            checklistItemId: checklist_item_id,
            checklistIndex: checklist_index,
          });

          return jsonResponse({
            id: result.id,
            toggledItemId: result.checklistItemId,
            checked: result.checked,
            items: result.items,
          });
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
  // Handle HEAD requests gracefully (required after OAuth redirects)
  if (req.method === "HEAD") {
    return new Response(null, { status: 200 });
  }

  // Validate auth
  const tokenInfo = await validateAuth(req);
  if (!tokenInfo) {
    return authErrorResponse("No authorization provided");
  }

  const scopes = tokenInfo.scope.split(/[\s,]+/);

  const t = await createTransport();

  const authInfo = {
    token: "",
    clientId: "dump-mcp",
    scopes,
    extra: {
      accessToken: tokenInfo.accessToken,
      userId: tokenInfo.userId,
      userName: tokenInfo.user.name,
      userEmail: tokenInfo.user.email,
    },
  };

  try {
    return await t.handleRequest(req, { authInfo });
  } catch (err) {
    console.error("[MCP] handleRequest error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

export { handler as GET, handler as POST, handler as DELETE, handler as HEAD };
