import { internalMutation } from "./_generated/server";

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const b of bytes) slug += chars[b % chars.length];
  return slug;
}

export const backfillSlugs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db.query("boards").collect();
    let fixed = 0;
    for (const board of boards) {
      if (!(board as Record<string, unknown>).slug) {
        await ctx.db.patch(board._id, { slug: generateSlug() });
        fixed++;
      }
    }
    return { total: boards.length, fixed };
  },
});

export const ensureOwnerMemberships = internalMutation({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db.query("boards").collect();
    let fixed = 0;

    for (const board of boards) {
      const existing = await ctx.db
        .query("boardMembers")
        .withIndex("by_boardId_userId", (q) =>
          q.eq("boardId", board._id).eq("userId", board.ownerId)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("boardMembers", {
          boardId: board._id,
          userId: board.ownerId,
          role: "owner",
          joinedAt: board.createdAt,
        });
        fixed++;
      }
    }

    return { total: boards.length, fixed };
  },
});
