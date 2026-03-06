import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getOrCreateUser = mutation({
  args: {
    firebaseUid: v.string(),
    email: v.string(),
    name: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", args.firebaseUid))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        profileImage: args.profileImage,
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      firebaseUid: args.firebaseUid,
      email: args.email,
      name: args.name,
      profileImage: args.profileImage,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      0,
      internal.boards.seedDefaultBoard,
      { userId }
    );

    // Resolve any pending board invites for this email
    await ctx.scheduler.runAfter(
      0,
      internal.boardMembers.resolveInvitesByEmail,
      { email: args.email.toLowerCase(), userId }
    );

    return userId;
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) =>
        q.eq("firebaseUid", identity.subject)
      )
      .unique();

    return user;
  },
});
