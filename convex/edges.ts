import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkBoardReadAccess, requireBoardWriteAccess } from "./lib/auth";

export const getEdgesByBoard = query({
  args: {
    boardId: v.id("boards"),
    shareToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const canRead = await checkBoardReadAccess(ctx, args.boardId, args.shareToken);
    if (!canRead) return [];

    return await ctx.db
      .query("edges")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
  },
});

export const createEdge = mutation({
  args: {
    boardId: v.id("boards"),
    source: v.id("nodes"),
    target: v.id("nodes"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireBoardWriteAccess(ctx, args.boardId);

    // Validate both nodes exist and belong to the board
    const sourceNode = await ctx.db.get(args.source);
    if (!sourceNode || sourceNode.boardId !== args.boardId) {
      throw new Error("Source node not found or doesn't belong to this board");
    }
    const targetNode = await ctx.db.get(args.target);
    if (!targetNode || targetNode.boardId !== args.boardId) {
      throw new Error("Target node not found or doesn't belong to this board");
    }

    // Prevent duplicate source→target pairs
    const existing = await ctx.db
      .query("edges")
      .withIndex("by_source", (q) => q.eq("source", args.source))
      .collect();
    if (existing.some((e) => e.target === args.target)) {
      throw new Error("Edge already exists");
    }

    return await ctx.db.insert("edges", {
      boardId: args.boardId,
      source: args.source,
      target: args.target,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const deleteEdge = mutation({
  args: { edgeId: v.id("edges") },
  handler: async (ctx, args) => {
    const edge = await ctx.db.get(args.edgeId);
    if (!edge) throw new Error("Edge not found");
    await requireBoardWriteAccess(ctx, edge.boardId);
    await ctx.db.delete(args.edgeId);
  },
});
