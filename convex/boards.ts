import { mutation, query, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";

export const createBoard = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    visibility: v.union(
      v.literal("private"),
      v.literal("shared"),
      v.literal("public")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const shareToken =
      args.visibility === "shared"
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
        : undefined;

    const boardId = await ctx.db.insert("boards", {
      name: args.name,
      icon: args.icon,
      ownerId: user._id,
      visibility: args.visibility,
      shareToken,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("boardMembers", {
      boardId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
    });

    return boardId;
  },
});

export const getMyBoards = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) return [];

    const memberships = await ctx.db
      .query("boardMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const boards = await Promise.all(
      memberships.map(async (m) => {
        const board = await ctx.db.get(m.boardId);
        if (!board) return null;
        const memberCount = (
          await ctx.db
            .query("boardMembers")
            .withIndex("by_boardId", (q) => q.eq("boardId", m.boardId))
            .collect()
        ).length;
        return { ...board, role: m.role, memberCount };
      })
    );

    return boards.filter(Boolean);
  },
});

export const getBoard = query({
  args: {
    boardId: v.id("boards"),
    shareToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) return null;

    // Public boards are always accessible
    if (board.visibility === "public") return board;

    // Shared boards with valid token
    if (
      board.visibility === "shared" &&
      args.shareToken &&
      board.shareToken === args.shareToken
    ) {
      return board;
    }

    // Check membership for private/shared without token
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) return null;

    const membership = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", args.boardId).eq("userId", user._id)
      )
      .unique();

    if (!membership) return null;
    return board;
  },
});

export const updateBoard = mutation({
  args: {
    boardId: v.id("boards"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("shared"), v.literal("public"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const board = await ctx.db.get(args.boardId);
    if (!board || board.ownerId !== user._id)
      throw new Error("Not authorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
      if (args.visibility === "shared" && !board.shareToken) {
        updates.shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      }
    }

    await ctx.db.patch(args.boardId, updates);
  },
});

export const deleteBoard = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const board = await ctx.db.get(args.boardId);
    if (!board || board.ownerId !== user._id)
      throw new Error("Not authorized");

    // Delete all nodes
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
    for (const node of nodes) {
      await ctx.db.delete(node._id);
    }

    // Delete all members
    const members = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    await ctx.db.delete(args.boardId);
  },
});

export const updateBoardSettings = mutation({
  args: {
    boardId: v.id("boards"),
    settings: v.object({
      backgroundPattern: v.optional(
        v.union(
          v.literal("dots"),
          v.literal("paper"),
          v.literal("boxes"),
          v.literal("blank")
        )
      ),
      backgroundColor: v.optional(v.string()),
      controlsVariant: v.optional(
        v.union(v.literal("default"), v.literal("map"))
      ),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Allow any member to update settings
    const membership = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", args.boardId).eq("userId", user._id)
      )
      .unique();
    if (!membership) throw new Error("Not authorized");

    const board = await ctx.db.get(args.boardId);
    if (!board) throw new Error("Board not found");

    await ctx.db.patch(args.boardId, {
      settings: { ...board.settings, ...args.settings },
      updatedAt: Date.now(),
    });
  },
});

export const regenerateShareToken = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const board = await ctx.db.get(args.boardId);
    if (!board || board.ownerId !== user._id)
      throw new Error("Not authorized");

    const newToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await ctx.db.patch(args.boardId, {
      shareToken: newToken,
      updatedAt: Date.now(),
    });

    return newToken;
  },
});

export const seedDefaultBoard = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const boardId = await ctx.db.insert("boards", {
      name: "Welcome to Dump",
      icon: "👋",
      ownerId: args.userId,
      visibility: "private",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("boardMembers", {
      boardId,
      userId: args.userId,
      role: "owner",
      joinedAt: now,
    });

    const templateNodes: Array<{
      type: "link" | "text";
      content: string;
      position: { x: number; y: number };
      dimensions: { width: number; height: number };
    }> = [
      {
        type: "link",
        content: "https://news.ycombinator.com",
        position: { x: 100, y: 100 },
        dimensions: { width: 280, height: 120 },
      },
      {
        type: "link",
        content: "https://en.wikipedia.org/wiki/Australian_magpie",
        position: { x: 420, y: 100 },
        dimensions: { width: 280, height: 120 },
      },
      {
        type: "link",
        content: "https://magpai.app",
        position: { x: 740, y: 100 },
        dimensions: { width: 280, height: 120 },
      },
      {
        type: "text",
        content:
          "Welcome! This is your first board. Drop links, paste notes, and share with your team.",
        position: { x: 100, y: 300 },
        dimensions: { width: 320, height: 120 },
      },
      {
        type: "text",
        content:
          "Tip: Right-click the canvas to add new items, or just paste a URL.",
        position: { x: 460, y: 300 },
        dimensions: { width: 320, height: 120 },
      },
    ];

    for (const node of templateNodes) {
      const nodeId = await ctx.db.insert("nodes", {
        boardId,
        type: node.type,
        content: node.content,
        position: node.position,
        dimensions: node.dimensions,
        createdBy: args.userId,
        createdAt: now,
        updatedAt: now,
      });

      if (node.type === "link") {
        await ctx.scheduler.runAfter(0, api.nodes.fetchLinkMetadata, {
          nodeId,
          url: node.content,
        });
      }
    }
  },
});

export const getMyBoardsWithRecentNodes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) return [];

    const memberships = await ctx.db
      .query("boardMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const boards = await Promise.all(
      memberships.map(async (m) => {
        const board = await ctx.db.get(m.boardId);
        if (!board) return null;
        const memberCount = (
          await ctx.db
            .query("boardMembers")
            .withIndex("by_boardId", (q) => q.eq("boardId", m.boardId))
            .collect()
        ).length;
        const nodes = await ctx.db
          .query("nodes")
          .withIndex("by_boardId", (q) => q.eq("boardId", m.boardId))
          .collect();
        // Sort by updatedAt descending and take top 4
        const recentNodes = nodes
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 4)
          .map((n) => ({
            _id: n._id,
            type: n.type,
            content: n.content,
            metadata: n.metadata,
            updatedAt: n.updatedAt,
          }));
        return { ...board, role: m.role, memberCount, recentNodes };
      })
    );

    return boards.filter(Boolean);
  },
});

export const persistLocalBoard = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    nodes: v.array(
      v.object({
        type: v.union(v.literal("text"), v.literal("link"), v.literal("checklist")),
        content: v.string(),
        position: v.object({ x: v.number(), y: v.number() }),
        metadata: v.optional(
          v.object({
            title: v.optional(v.string()),
            favicon: v.optional(v.string()),
            description: v.optional(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const now = Date.now();

    const boardId = await ctx.db.insert("boards", {
      name: args.name,
      icon: args.icon,
      ownerId: user._id,
      visibility: "private",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("boardMembers", {
      boardId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
    });

    for (const node of args.nodes) {
      await ctx.db.insert("nodes", {
        boardId,
        type: node.type,
        content: node.content,
        position: node.position,
        dimensions: { width: 280, height: 120 },
        metadata: node.metadata,
        createdBy: user._id,
        createdAt: now,
        updatedAt: now,
      });
    }

    return boardId;
  },
});

export const getBoardCount = query({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db.query("boards").collect();
    return boards.length;
  },
});

export const getBoardForMarkdown = query({
  args: {
    boardId: v.id("boards"),
    shareToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) return null;

    // Only public or shared (with valid token) boards are bot-accessible
    if (board.visibility === "public") {
      // ok
    } else if (
      board.visibility === "shared" &&
      args.shareToken &&
      board.shareToken === args.shareToken
    ) {
      // ok
    } else {
      return null;
    }

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();

    return { board, nodes };
  },
});
