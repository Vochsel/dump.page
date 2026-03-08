import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

export async function getAuthUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
    .unique();
}

export async function requireAuthUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getAuthUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireBoardMember(
  ctx: Ctx,
  boardId: Id<"boards">
): Promise<{ user: Doc<"users">; membership: Doc<"boardMembers"> }> {
  const user = await requireAuthUser(ctx);
  const membership = await ctx.db
    .query("boardMembers")
    .withIndex("by_boardId_userId", (q) =>
      q.eq("boardId", boardId).eq("userId", user._id)
    )
    .unique();
  if (!membership) throw new Error("Not a board member");
  return { user, membership };
}

export async function requireBoardOwner(
  ctx: Ctx,
  boardId: Id<"boards">
): Promise<{ user: Doc<"users">; board: Doc<"boards"> }> {
  const user = await requireAuthUser(ctx);
  const board = await ctx.db.get(boardId);
  if (!board || board.ownerId !== user._id) throw new Error("Not authorized");
  return { user, board };
}

export async function checkBoardReadAccess(
  ctx: Ctx,
  boardId: Id<"boards">,
  shareToken?: string
): Promise<boolean> {
  const board = await ctx.db.get(boardId);
  if (!board) return false;

  // Public boards are always readable
  if (board.visibility === "public") return true;

  // Shared boards with valid token
  if (
    board.visibility === "shared" &&
    shareToken &&
    board.shareToken === shareToken
  ) {
    return true;
  }

  // Check membership
  const user = await getAuthUser(ctx);
  if (!user) return false;

  const membership = await ctx.db
    .query("boardMembers")
    .withIndex("by_boardId_userId", (q) =>
      q.eq("boardId", boardId).eq("userId", user._id)
    )
    .unique();

  return !!membership;
}

export async function requireBoardWriteAccess(
  ctx: Ctx,
  boardId: Id<"boards">
): Promise<{ user: Doc<"users">; membership: Doc<"boardMembers"> }> {
  return requireBoardMember(ctx, boardId);
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireAuthUser(ctx);
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (!adminEmails.includes(user.email)) {
    throw new Error("Not authorized: admin access required");
  }
  return user;
}
