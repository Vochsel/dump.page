import { internalMutation } from "./_generated/server";

export const snapshotDailyStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);

    const existing = await ctx.db
      .query("dailyStats")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (existing) return;

    const users = (await ctx.db.query("users").collect()).length;
    const boards = (await ctx.db.query("boards").collect()).length;
    const nodes = (await ctx.db.query("nodes").collect()).length;

    await ctx.db.insert("dailyStats", { date: today, users, boards, nodes });
  },
});
