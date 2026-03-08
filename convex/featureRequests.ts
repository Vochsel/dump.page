import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const submit = mutation({
  args: {
    type: v.union(v.literal("feature"), v.literal("fix")),
    kind: v.union(v.literal("request"), v.literal("prompt")),
    description: v.string(),
    email: v.optional(v.string()),
    creditOptIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("featureRequests", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const requests = await ctx.db.query("featureRequests").collect();
    return requests.sort((a, b) => b.createdAt - a.createdAt);
  },
});
