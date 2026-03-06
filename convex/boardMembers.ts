import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
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

    const normalizedEmail = args.email.toLowerCase().trim();

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (targetUser) {
      // User exists — add them directly
      const existing = await ctx.db
        .query("boardMembers")
        .withIndex("by_boardId_userId", (q) =>
          q.eq("boardId", args.boardId).eq("userId", targetUser._id)
        )
        .unique();
      if (existing) throw new Error("User is already a member");

      await ctx.db.insert("boardMembers", {
        boardId: args.boardId,
        userId: targetUser._id,
        role: "editor",
        joinedAt: Date.now(),
      });

      // Send notification email (if enabled)
      if (process.env.ENABLE_EMAILS === "true") {
        const inviteToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
        await ctx.scheduler.runAfter(0, internal.email.sendBoardInviteEmail, {
          toEmail: normalizedEmail,
          boardName: board.name,
          boardId: args.boardId,
          inviterName: currentUser.name,
          inviteToken,
          isExistingUser: true,
        });
      }

      return { status: "added" as const };
    }

    // User doesn't exist — create a pending invite
    const existingInvite = await ctx.db
      .query("boardInvites")
      .withIndex("by_boardId_email", (q) =>
        q.eq("boardId", args.boardId).eq("email", normalizedEmail)
      )
      .unique();
    if (existingInvite) throw new Error("Invite already sent to this email");

    const inviteToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    await ctx.db.insert("boardInvites", {
      boardId: args.boardId,
      email: normalizedEmail,
      inviteToken,
      invitedBy: currentUser._id,
      createdAt: Date.now(),
    });

    if (process.env.ENABLE_EMAILS === "true") {
      await ctx.scheduler.runAfter(0, internal.email.sendBoardInviteEmail, {
        toEmail: normalizedEmail,
        boardName: board.name,
        boardId: args.boardId,
        inviterName: currentUser.name,
        inviteToken,
        isExistingUser: false,
      });
    }

    return { status: "invited" as const };
  },
});

export const resolveInviteByToken = mutation({
  args: { inviteToken: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const invite = await ctx.db
      .query("boardInvites")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
      .unique();
    if (!invite) return null;

    // Check if already a member
    const existing = await ctx.db
      .query("boardMembers")
      .withIndex("by_boardId_userId", (q) =>
        q.eq("boardId", invite.boardId).eq("userId", user._id)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("boardMembers", {
        boardId: invite.boardId,
        userId: user._id,
        role: "editor",
        joinedAt: Date.now(),
      });
    }

    await ctx.db.delete(invite._id);
    return { boardId: invite.boardId };
  },
});

export const resolveInvitesByEmail = internalMutation({
  args: {
    email: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("boardInvites")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    for (const invite of invites) {
      const existing = await ctx.db
        .query("boardMembers")
        .withIndex("by_boardId_userId", (q) =>
          q.eq("boardId", invite.boardId).eq("userId", args.userId)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("boardMembers", {
          boardId: invite.boardId,
          userId: args.userId,
          role: "editor",
          joinedAt: Date.now(),
        });
      }

      await ctx.db.delete(invite._id);
    }
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

export const cancelInvite = mutation({
  args: { inviteId: v.id("boardInvites") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");

    const board = await ctx.db.get(invite.boardId);
    if (!board || board.ownerId !== currentUser._id)
      throw new Error("Not authorized");

    await ctx.db.delete(args.inviteId);
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

export const getPendingInvites = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boardInvites")
      .withIndex("by_boardId_email", (q) => q.eq("boardId", args.boardId))
      .collect();
  },
});

export const checkAccess = query({
  args: {
    boardId: v.id("boards"),
    shareToken: v.optional(v.string()),
    inviteToken: v.optional(v.string()),
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

    // Valid invite token: allow viewing (blurred preview)
    if (args.inviteToken) {
      const invite = await ctx.db
        .query("boardInvites")
        .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
        .unique();
      if (invite && invite.boardId === args.boardId) {
        return { canView: true, canEdit: false, board, pendingInvite: true };
      }
    }

    return { canView: false, canEdit: false, board: null };
  },
});
