import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// --- OAuth client registration ---

export const registerClient = mutation({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    redirectUris: v.array(v.string()),
    clientName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("oauthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        redirectUris: args.redirectUris,
        clientName: args.clientName,
      });
      return existing._id;
    }
    return await ctx.db.insert("oauthClients", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getClient = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("oauthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();
  },
});

// --- OAuth authorization codes ---

export const createAuthCode = mutation({
  args: {
    code: v.string(),
    clientId: v.string(),
    userId: v.id("users"),
    codeChallenge: v.string(),
    codeChallengeMethod: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("oauthCodes", {
      ...args,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });
  },
});

export const consumeAuthCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("oauthCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!record) return null;
    await ctx.db.delete(record._id);
    if (record.expiresAt < Date.now()) return null;
    return record;
  },
});

// --- MCP user queries (called from Next.js MCP server) ---

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getBoardsByUserId = query({
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
        return {
          id: board._id,
          name: board.name,
          icon: board.icon,
          visibility: board.visibility,
          role: m.role,
          createdAt: board.createdAt,
          updatedAt: board.updatedAt,
        };
      })
    );

    return boards.filter(Boolean);
  },
});

export const getBoardWithNodes = query({
  args: {
    boardId: v.id("boards"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) return null;

    // Check membership
    const membership = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", args.boardId).eq("userId", args.userId)
      )
      .unique();

    // Allow access if member, or if board is public
    if (!membership && board.visibility !== "public") return null;

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();

    return { board, nodes };
  },
});
