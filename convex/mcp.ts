import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// MCP-specific queries that accept userId directly (auth handled by MCP OAuth layer)

export const listBoards = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("boardMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const boards = await Promise.all(
      memberships.map(async (m) => {
        const board = await ctx.db.get(m.boardId);
        if (!board) return null;
        const nodeCount = (
          await ctx.db
            .query("nodes")
            .withIndex("by_boardId", (q) => q.eq("boardId", m.boardId))
            .collect()
        ).filter((n) => !n.archived).length;
        return {
          id: board._id,
          slug: board.slug,
          name: board.name,
          icon: board.icon,
          visibility: board.visibility,
          role: m.role,
          nodeCount,
          updatedAt: board.updatedAt,
          createdAt: board.createdAt,
        };
      })
    );

    return boards.filter(Boolean);
  },
});

export const searchBoards = query({
  args: { userId: v.id("users"), query: v.string() },
  handler: async (ctx, args) => {
    const searchLower = args.query.toLowerCase();
    const memberships = await ctx.db
      .query("boardMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const boards = await Promise.all(
      memberships.map(async (m) => {
        const board = await ctx.db.get(m.boardId);
        if (!board) return null;
        if (!board.name.toLowerCase().includes(searchLower)) return null;
        return {
          id: board._id,
          slug: board.slug,
          name: board.name,
          icon: board.icon,
          visibility: board.visibility,
          role: m.role,
          updatedAt: board.updatedAt,
        };
      })
    );

    return boards.filter(Boolean);
  },
});

export const getBoardBySlug = query({
  args: { userId: v.id("users"), slug: v.string() },
  handler: async (ctx, args) => {
    let board = await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!board) {
      try {
        const byId = await ctx.db.get(args.slug as Id<"boards">);
        if (byId) board = byId;
      } catch {
        // Not a valid ID
      }
    }
    if (!board) return null;

    // Check access: member, public, or shared
    const membership = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", board!._id).eq("userId", args.userId)
      )
      .unique();

    const isMember = !!membership;

    if (!isMember && board.visibility === "private") {
      return null;
    }

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", board!._id))
      .collect();

    return {
      board: {
        id: board._id,
        slug: board.slug,
        name: board.name,
        icon: board.icon,
        visibility: board.visibility,
        settings: board.settings,
        canEdit: isMember,
        updatedAt: board.updatedAt,
        createdAt: board.createdAt,
      },
      nodes: nodes
        .filter((n) => !n.archived)
        .map((n) => ({
          id: n._id,
          type: n.type,
          content: n.content,
          title: n.title,
          metadata: n.metadata,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
    };
  },
});

export const searchItems = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
    boardSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const searchLower = args.query.toLowerCase();

    // If boardSlug provided, search only that board
    if (args.boardSlug) {
      const board = await ctx.db
        .query("boards")
        .withIndex("by_slug", (q) => q.eq("slug", args.boardSlug!))
        .unique();
      if (!board) return [];

      // Check access
      const membership = await ctx.db
        .query("boardMembers")
        .withIndex("by_boardId_userId", (q) =>
          q.eq("boardId", board._id).eq("userId", args.userId)
        )
        .unique();
      if (!membership && board.visibility === "private") return [];

      const nodes = await ctx.db
        .query("nodes")
        .withIndex("by_boardId", (q) => q.eq("boardId", board._id))
        .collect();

      return nodes
        .filter((n) => !n.archived)
        .filter((n) => {
          const content = n.content.toLowerCase();
          const title = (n.title || "").toLowerCase();
          const metaTitle = (n.metadata?.title || "").toLowerCase();
          const metaDesc = (n.metadata?.description || "").toLowerCase();
          return (
            content.includes(searchLower) ||
            title.includes(searchLower) ||
            metaTitle.includes(searchLower) ||
            metaDesc.includes(searchLower)
          );
        })
        .slice(0, 50)
        .map((n) => ({
          id: n._id,
          boardSlug: board.slug,
          boardName: board.name,
          type: n.type,
          content: n.content,
          title: n.title,
          metadata: n.metadata,
          updatedAt: n.updatedAt,
        }));
    }

    // Search across all user's boards
    const memberships = await ctx.db
      .query("boardMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const results: Array<{
      id: Id<"nodes">;
      boardSlug: string;
      boardName: string;
      type: string;
      content: string;
      title?: string;
      metadata?: {
        title?: string;
        description?: string;
      };
      updatedAt: number;
    }> = [];

    for (const m of memberships) {
      if (results.length >= 50) break;

      const board = await ctx.db.get(m.boardId);
      if (!board) continue;

      const nodes = await ctx.db
        .query("nodes")
        .withIndex("by_boardId", (q) => q.eq("boardId", m.boardId))
        .collect();

      for (const n of nodes) {
        if (results.length >= 50) break;
        if (n.archived) continue;

        const content = n.content.toLowerCase();
        const title = (n.title || "").toLowerCase();
        const metaTitle = (n.metadata?.title || "").toLowerCase();
        const metaDesc = (n.metadata?.description || "").toLowerCase();

        if (
          content.includes(searchLower) ||
          title.includes(searchLower) ||
          metaTitle.includes(searchLower) ||
          metaDesc.includes(searchLower)
        ) {
          results.push({
            id: n._id,
            boardSlug: board.slug,
            boardName: board.name,
            type: n.type,
            content: n.content,
            title: n.title,
            metadata: n.metadata
              ? { title: n.metadata.title, description: n.metadata.description }
              : undefined,
            updatedAt: n.updatedAt,
          });
        }
      }
    }

    return results;
  },
});

export const createNote = mutation({
  args: {
    userId: v.id("users"),
    boardSlug: v.string(),
    content: v.string(),
    title: v.optional(v.string()),
    type: v.optional(
      v.union(v.literal("text"), v.literal("link"), v.literal("checklist"))
    ),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", args.boardSlug))
      .unique();
    if (!board) throw new Error("Board not found");

    // Check membership (must be a member to create)
    const membership = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", board._id).eq("userId", args.userId)
      )
      .unique();
    if (!membership) throw new Error("Not authorized");

    // Find a reasonable position (offset from last node)
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", board._id))
      .collect();
    const activeNodes = nodes.filter((n) => !n.archived);
    const maxY = activeNodes.reduce(
      (max, n) => Math.max(max, n.position.y + n.dimensions.height),
      0
    );

    const now = Date.now();
    const nodeId = await ctx.db.insert("nodes", {
      boardId: board._id,
      type: args.type || "text",
      content: args.content,
      title: args.title,
      showTitle: args.title ? true : undefined,
      position: { x: 100, y: maxY + 40 },
      dimensions: { width: 280, height: 120 },
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(board._id, { updatedAt: now });

    return { id: nodeId, boardSlug: board.slug };
  },
});

export const addItems = mutation({
  args: {
    userId: v.id("users"),
    boardSlug: v.string(),
    items: v.array(
      v.object({
        type: v.union(v.literal("text"), v.literal("link"), v.literal("checklist")),
        content: v.string(),
        title: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", args.boardSlug))
      .unique();
    if (!board) throw new Error("Board not found");

    const membership = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", board._id).eq("userId", args.userId)
      )
      .unique();
    if (!membership) throw new Error("Not authorized");

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", board._id))
      .collect();
    const activeNodes = nodes.filter((n) => !n.archived);
    let maxY = activeNodes.reduce(
      (max, n) => Math.max(max, n.position.y + n.dimensions.height),
      0
    );

    const now = Date.now();
    const ids: string[] = [];

    for (const item of args.items) {
      const nodeId = await ctx.db.insert("nodes", {
        boardId: board._id,
        type: item.type,
        content: item.content,
        title: item.title,
        showTitle: item.title ? true : undefined,
        position: { x: 100, y: maxY + 40 },
        dimensions: { width: 280, height: 120 },
        createdBy: args.userId,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(nodeId);
      maxY += 160;
    }

    await ctx.db.patch(board._id, { updatedAt: now });

    return { ids, boardSlug: board.slug, count: ids.length };
  },
});

export const updateNote = mutation({
  args: {
    userId: v.id("users"),
    nodeId: v.id("nodes"),
    content: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) throw new Error("Note not found");

    // Check membership
    const membership = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", node.boardId).eq("userId", args.userId)
      )
      .unique();
    if (!membership) throw new Error("Not authorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.content !== undefined) updates.content = args.content;
    if (args.title !== undefined) {
      updates.title = args.title;
      updates.showTitle = !!args.title;
    }

    await ctx.db.patch(args.nodeId, updates);
    await ctx.db.patch(node.boardId, { updatedAt: Date.now() });

    return { id: args.nodeId };
  },
});
