import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkBoardReadAccess, requireBoardWriteAccess } from "./lib/auth";

const columnValidator = v.object({
  id: v.string(),
  title: v.string(),
  nodeIds: v.array(v.id("nodes")),
});

export const getLayoutByBoard = query({
  args: {
    boardId: v.id("boards"),
    shareToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const canRead = await checkBoardReadAccess(ctx, args.boardId, args.shareToken);
    if (!canRead) return null;

    const layout = await ctx.db
      .query("kanbanLayouts")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .unique();
    return layout;
  },
});

export const setLayout = mutation({
  args: {
    boardId: v.id("boards"),
    columns: v.array(columnValidator),
  },
  handler: async (ctx, args) => {
    await requireBoardWriteAccess(ctx, args.boardId);

    const existing = await ctx.db
      .query("kanbanLayouts")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        columns: args.columns,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("kanbanLayouts", {
      boardId: args.boardId,
      columns: args.columns,
      updatedAt: now,
    });
  },
});
