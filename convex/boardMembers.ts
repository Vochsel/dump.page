import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, requireBoardOwner } from "./lib/auth";
import { authedMutation } from "./lib/functions";

export const addMember = authedMutation({
  args: {
    boardId: v.id("boards"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await requireBoardOwner(ctx, args.boardId, ctx.user._id);

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!targetUser) throw new Error("No account found for that email. They need to sign up first.");

    const existing = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", args.boardId).eq("userId", targetUser._id)
      )
      .unique();
    if (existing) throw new Error("User is already a member");

    return await ctx.db.insert("boardMembers", {
      boardId: args.boardId,
      userId: targetUser._id,
      role: "editor",
      joinedAt: Date.now(),
    });
  },
});

export const removeMember = authedMutation({
  args: {
    boardId: v.id("boards"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireBoardOwner(ctx, args.boardId, ctx.user._id);

    const membership = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", args.boardId).eq("userId", args.userId)
      )
      .unique();
    if (!membership) throw new Error("Membership not found");
    if (membership.role === "owner") throw new Error("Cannot remove the owner");

    await ctx.db.delete(membership._id);
  },
});

export const getMembers = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) return [];

    // Only members can list members on non-public boards
    if (board.visibility !== "public") {
      const user = await getCurrentUser(ctx);
      if (!user) return [];

      const membership = await ctx.db
        .query("boardMembers")
        .withIndex("by_boardId_userId", (q) =>
          q.eq("boardId", args.boardId).eq("userId", user._id)
        )
        .unique();
      if (!membership) return [];
    }

    const members = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();

    return await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return { ...m, user };
      })
    );
  },
});

export const checkAccess = query({
  args: {
    slug: v.string(),
    shareToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try lookup by slug first, then fall back to treating it as a board ID
    let board = await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!board) {
      try {
        const byId = await ctx.db.get(args.slug as Id<"boards">);
        if (byId) board = byId;
      } catch {
        // Not a valid ID, ignore
      }
    }
    if (!board) return { canView: false, canEdit: false, board: null };

    const user = await getCurrentUser(ctx);
    let membership: Doc<"boardMembers"> | null = null;

    if (user) {
      membership = await ctx.db
        .query("boardMembers")
        .withIndex("by_boardId_userId", (q) =>
          q.eq("boardId", board!._id).eq("userId", user._id)
        )
        .unique();
    }

    // Members can always view and edit
    if (membership) {
      return { canView: true, canEdit: true, board, role: membership.role };
    }

    // Public boards: anyone can view
    if (board.visibility === "public") {
      return { canView: true, canEdit: false, board };
    }

    // Shared boards with valid token: can view
    if (
      board.visibility === "shared" &&
      args.shareToken &&
      board.shareToken === args.shareToken
    ) {
      return { canView: true, canEdit: false, board };
    }

    return { canView: false, canEdit: false, board: null };
  },
});
