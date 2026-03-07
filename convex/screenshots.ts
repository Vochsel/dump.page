import {
  query,
  mutation,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const THROTTLE_MS = 60 * 60 * 1000; // 1 hour
const DEBOUNCE_MS = 30 * 1000; // 30 seconds

function assertScreenshotSecret(secret: string | undefined) {
  const expected = process.env.SCREENSHOT_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Invalid screenshot secret");
  }
}

// Public query guarded by secret: get board + nodes for screenshot rendering
export const getBoardForScreenshot = query({
  args: { boardId: v.id("boards"), secret: v.string() },
  handler: async (ctx, args) => {
    assertScreenshotSecret(args.secret);

    const board = await ctx.db.get(args.boardId);
    if (!board) return null;

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();

    return {
      board,
      nodes: nodes.filter((n) => !n.archived),
    };
  },
});

// Public mutation guarded by secret: generate upload URL
export const generateUploadUrl = mutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    assertScreenshotSecret(args.secret);
    return await ctx.storage.generateUploadUrl();
  },
});

// Public mutation guarded by secret: save storageId on board, delete old thumbnail
export const storeThumbnail = mutation({
  args: {
    boardId: v.id("boards"),
    storageId: v.id("_storage"),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    assertScreenshotSecret(args.secret);

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

// Internal mutation: throttle check + schedule the screenshot action
export const requestScreenshot = internalMutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) return;

    const now = Date.now();

    // Throttle: skip if last request was less than 1 hour ago
    if (
      board.screenshotLastRequestedAt &&
      now - board.screenshotLastRequestedAt < THROTTLE_MS
    ) {
      return;
    }

    await ctx.db.patch(args.boardId, {
      screenshotLastRequestedAt: now,
    });

    // Schedule the screenshot action with a 30s debounce delay
    await ctx.scheduler.runAfter(
      DEBOUNCE_MS,
      internal.screenshots.takeScreenshot,
      { boardId: args.boardId }
    );
  },
});

// Internal action: call the screenshot API endpoint
export const takeScreenshot = internalAction({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const appUrl = process.env.APP_URL;
    const secret = process.env.SCREENSHOT_SECRET;

    if (!appUrl || !secret) {
      console.error("Missing APP_URL or SCREENSHOT_SECRET env vars");
      return;
    }

    try {
      const res = await fetch(`${appUrl}/api/screenshot/${args.boardId}`, {
        method: "POST",
        headers: {
          "x-screenshot-secret": secret,
        },
      });

      if (!res.ok) {
        console.error(
          `Screenshot failed for board ${args.boardId}: ${res.status} ${await res.text()}`
        );
      }
    } catch (err) {
      console.error(
        `Screenshot request failed for board ${args.boardId}:`,
        err
      );
    }
  },
});

// Public query: resolve thumbnailStorageId to a URL
export const getThumbnailUrl = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board?.thumbnailStorageId) return null;
    return await ctx.storage.getUrl(board.thumbnailStorageId);
  },
});
