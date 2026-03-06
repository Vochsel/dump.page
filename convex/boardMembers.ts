import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const addMember = mutation({
  args: {
    boardId: v.id("boards"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const board = await ctx.db.get(args.boardId);
    if (!board || board.ownerId !== currentUser._id)
      throw new Error("Not authorized");

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

export const removeMember = mutation({
  args: {
    boardId: v.id("boards"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const board = await ctx.db.get(args.boardId);
    if (!board || board.ownerId !== currentUser._id)
      throw new Error("Not authorized");

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
    boardId: v.id("boards"),
    shareToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) return { canView: false, canEdit: false, board: null };

    const identity = await ctx.auth.getUserIdentity();
    let user: Doc<"users"> | null = null;
    let membership: Doc<"boardMembers"> | null = null;

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_firebaseUid", (q) =>
          q.eq("firebaseUid", identity.subject)
        )
        .unique();

      if (user) {
        membership = await ctx.db
          .query("boardMembers")
          .withIndex("by_boardId_userId", (q) =>
            q.eq("boardId", args.boardId).eq("userId", user!._id)
          )
          .unique();
      }
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
