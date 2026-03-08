import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireBoardMember, checkBoardReadAccess } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const storeThumbnail = mutation({
  args: {
    boardId: v.id("boards"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireBoardMember(ctx, args.boardId);

    const board = await ctx.db.get(args.boardId);
    if (!board) return;

    // Delete old thumbnail if it exists
    if (board.thumbnailStorageId) {
      await ctx.storage.delete(board.thumbnailStorageId);
    }

    await ctx.db.patch(args.boardId, {
      thumbnailStorageId: args.storageId,
    });
  },
});

export const getThumbnailUrl = query({
  args: {
    boardId: v.id("boards"),
    shareToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const canRead = await checkBoardReadAccess(ctx, args.boardId, args.shareToken);
    if (!canRead) return null;

    const board = await ctx.db.get(args.boardId);
    if (!board?.thumbnailStorageId) return null;
    return await ctx.storage.getUrl(board.thumbnailStorageId);
  },
});
