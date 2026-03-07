import { query } from "./_generated/server";
import { v } from "convex/values";

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const boards = await ctx.db.query("boards").collect();
    const nodes = await ctx.db.query("nodes").collect();
    const members = await ctx.db.query("boardMembers").collect();

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const usersLast24h = users.filter((u) => now - u.createdAt < day).length;
    const usersLast7d = users.filter((u) => now - u.createdAt < 7 * day).length;
    const usersLast30d = users.filter((u) => now - u.createdAt < 30 * day).length;

    const boardsLast24h = boards.filter((b) => now - b.createdAt < day).length;
    const boardsLast7d = boards.filter((b) => now - b.createdAt < 7 * day).length;
    const boardsLast30d = boards.filter((b) => now - b.createdAt < 30 * day).length;

    const nodesLast24h = nodes.filter((n) => now - n.createdAt < day).length;
    const nodesLast7d = nodes.filter((n) => now - n.createdAt < 7 * day).length;

    const visibilityCounts = { private: 0, shared: 0, public: 0 };
    for (const b of boards) visibilityCounts[b.visibility]++;

    const typeCounts = { text: 0, link: 0, checklist: 0 };
    for (const n of nodes) typeCounts[n.type]++;

    const nodesPerBoard = boards.map((b) => ({
      id: b._id,
      name: b.name,
      count: nodes.filter((n) => n.boardId === b._id).length,
    })).sort((a, b) => b.count - a.count);

    const avgNodesPerBoard = boards.length > 0 ? (nodes.length / boards.length).toFixed(1) : "0";
    const avgBoardsPerUser = users.length > 0 ? (boards.length / users.length).toFixed(1) : "0";

    return {
      totals: {
        users: users.length,
        boards: boards.length,
        nodes: nodes.length,
        memberships: members.length,
      },
      newUsers: { last24h: usersLast24h, last7d: usersLast7d, last30d: usersLast30d },
      newBoards: { last24h: boardsLast24h, last7d: boardsLast7d, last30d: boardsLast30d },
      newNodes: { last24h: nodesLast24h, last7d: nodesLast7d },
      visibility: visibilityCounts,
      nodeTypes: typeCounts,
      avgNodesPerBoard,
      avgBoardsPerUser,
      topBoards: nodesPerBoard.slice(0, 10),
    };
  },
});

export const recentUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const boards = await ctx.db.query("boards").collect();
    const members = await ctx.db.query("boardMembers").collect();

    return users
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
      .map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        joinedAt: new Date(u.createdAt).toISOString(),
        boardsOwned: boards.filter((b) => b.ownerId === u._id).length,
        memberships: members.filter((m) => m.userId === u._id).length,
      }));
  },
});

export const recentBoards = query({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db.query("boards").collect();
    const nodes = await ctx.db.query("nodes").collect();
    const users = await ctx.db.query("users").collect();
    const members = await ctx.db.query("boardMembers").collect();

    const userMap = new Map(users.map((u) => [u._id, u]));

    return boards
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
      .map((b) => {
        const owner = userMap.get(b.ownerId);
        const nodeCount = nodes.filter((n) => n.boardId === b._id).length;
        const memberCount = members.filter((m) => m.boardId === b._id).length;
        return {
          id: b._id,
          name: `${b.icon} ${b.name}`,
          owner: owner?.email ?? "unknown",
          visibility: b.visibility,
          nodes: nodeCount,
          members: memberCount,
          createdAt: new Date(b.createdAt).toISOString(),
          updatedAt: new Date(b.updatedAt).toISOString(),
        };
      });
  },
});

export const activeBoards = query({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db.query("boards").collect();
    const nodes = await ctx.db.query("nodes").collect();
    const users = await ctx.db.query("users").collect();
    const members = await ctx.db.query("boardMembers").collect();

    const userMap = new Map(users.map((u) => [u._id, u]));

    return boards
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 20)
      .map((b) => {
        const owner = userMap.get(b.ownerId);
        const nodeCount = nodes.filter((n) => n.boardId === b._id).length;
        const memberCount = members.filter((m) => m.boardId === b._id).length;
        return {
          id: b._id,
          name: `${b.icon} ${b.name}`,
          owner: owner?.email ?? "unknown",
          visibility: b.visibility,
          nodes: nodeCount,
          members: memberCount,
          updatedAt: new Date(b.updatedAt).toISOString(),
        };
      });
  },
});

export const dailyHistory = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.days ?? 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - limit);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const snapshots = await ctx.db
      .query("dailyStats")
      .withIndex("by_date", (q) => q.gte("date", cutoffStr))
      .collect();

    return snapshots.sort((a, b) => a.date.localeCompare(b.date));
  },
});
