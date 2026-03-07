import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { z } from "zod";
import { getBoardMarkdown } from "@/lib/board-markdown";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

const MCP_WRITE_ENABLED = process.env.MCP_WRITE_ENABLED === "true";

const handler = createMcpHandler(
  (server) => {
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
        const userId = authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [
              { type: "text", text: "Error: Not authenticated. Please reconnect." },
            ],
          };
        }

        const boards = await convex.query(api.mcp.listBoards, {
          userId: userId as Id<"users">,
        });

        if (!boards || boards.length === 0) {
          return {
            content: [{ type: "text", text: "You have no boards yet." }],
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
              type: "text",
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
        const userId = authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [{ type: "text", text: "Error: Not authenticated." }],
          };
        }

        // First check the user has access
        const board = await convex.query(api.mcp.getBoardBySlug, {
          userId: userId as Id<"users">,
          slug,
        });

        if (!board) {
          return {
            content: [
              {
                type: "text",
                text: "Board not found or you don't have access.",
              },
            ],
          };
        }

        // Use the existing markdown generator for rich output
        const { markdown } = await getBoardMarkdown(slug);

        return {
          content: [{ type: "text", text: markdown }],
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
        const userId = authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [{ type: "text", text: "Error: Not authenticated." }],
          };
        }

        const boards = await convex.query(api.mcp.searchBoards, {
          userId: userId as Id<"users">,
          query,
        });

        if (!boards || boards.length === 0) {
          return {
            content: [
              { type: "text", text: `No boards found matching "${query}".` },
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
              type: "text",
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
        const userId = authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [{ type: "text", text: "Error: Not authenticated." }],
          };
        }

        const items = await convex.query(api.mcp.searchItems, {
          userId: userId as Id<"users">,
          query,
          boardSlug: board_slug,
        });

        if (!items || items.length === 0) {
          return {
            content: [
              { type: "text", text: `No items found matching "${query}".` },
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
              type: "text",
              text: `Found ${items.length} item(s) matching "${query}":\n\n${list.join("\n")}`,
            },
          ],
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
          const userId = authInfo?.extra?.userId as string | undefined;
          if (!userId) {
            return {
              content: [{ type: "text", text: "Error: Not authenticated." }],
            };
          }

          const scope = (authInfo?.scopes || []) as string[];
          if (!scope.includes("write")) {
            return {
              content: [
                {
                  type: "text",
                  text: 'Error: Write permission required. Please reconnect with "write" scope.',
                },
              ],
            };
          }

          try {
            const result = await convex.mutation(api.mcp.createNote, {
              userId: userId as Id<"users">,
              boardSlug: board_slug,
              content,
              title,
              type: type as "text" | "link" | "checklist" | undefined,
            });

            return {
              content: [
                {
                  type: "text",
                  text: `Note created successfully on board \`${result.boardSlug}\` (id: ${result.id}).`,
                },
              ],
            };
          } catch (e) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error creating note: ${e instanceof Error ? e.message : "Unknown error"}`,
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
          const userId = authInfo?.extra?.userId as string | undefined;
          if (!userId) {
            return {
              content: [{ type: "text", text: "Error: Not authenticated." }],
            };
          }

          const scope = (authInfo?.scopes || []) as string[];
          if (!scope.includes("write")) {
            return {
              content: [
                {
                  type: "text",
                  text: 'Error: Write permission required. Please reconnect with "write" scope.',
                },
              ],
            };
          }

          try {
            await convex.mutation(api.mcp.updateNote, {
              userId: userId as Id<"users">,
              nodeId: note_id as Id<"nodes">,
              content,
              title,
            });

            return {
              content: [
                { type: "text", text: `Note ${note_id} updated successfully.` },
              ],
            };
          } catch (e) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error updating note: ${e instanceof Error ? e.message : "Unknown error"}`,
                },
              ],
            };
          }
        }
      );
    }
  },
  {
    serverInfo: {
      name: "dump-mcp",
      version: "1.0.0",
    },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    disableSse: true,
  }
);

// Wrap with auth
const authedHandler = withMcpAuth(
  handler,
  async (_req: Request, bearerToken?: string) => {
    if (!bearerToken) return undefined;

    const tokenInfo = await convex.query(api.mcpAuth.validateToken, {
      accessToken: bearerToken,
    });

    if (!tokenInfo) return undefined;

    return {
      token: bearerToken,
      clientId: "dump-mcp",
      scopes: tokenInfo.scope.split(/[\s,]+/),
      extra: {
        userId: tokenInfo.userId,
        userName: tokenInfo.user.name,
        userEmail: tokenInfo.user.email,
      },
    };
  },
  {
    required: true,
  }
);

export { authedHandler as GET, authedHandler as POST, authedHandler as DELETE };
