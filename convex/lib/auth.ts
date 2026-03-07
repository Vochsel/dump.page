import {
  QueryCtx,
  MutationCtx,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Look up the current user from the auth identity.
 * Returns null if not authenticated or user record doesn't exist yet.
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
    .unique();
}

/**
 * Require authentication and return the user.
 * Throws if not authenticated or user not found.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
    .unique();
  if (!user) throw new Error("User not found");

  return user;
}

/**
 * Require authentication and return the user, creating the user record
 * if it doesn't exist yet. Use this in entry-point mutations where
 * new users may not have a record yet (e.g. board creation).
 */
export async function ensureUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const existing = await ctx.db
    .query("users")
    .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
    .unique();
  if (existing) return existing;

  const userId = await ctx.db.insert("users", {
    firebaseUid: identity.subject,
    email: identity.email ?? "",
    name: identity.name ?? identity.email ?? "Anonymous",
    profileImage: identity.pictureUrl,
    createdAt: Date.now(),
  });

  await ctx.scheduler.runAfter(0, internal.boards.seedDefaultBoard, { userId });

  return (await ctx.db.get(userId))!;
}

/**
 * Require that the user is a member of the given board.
 * Returns the membership record.
 */
export async function requireBoardMember(
  ctx: QueryCtx | MutationCtx,
  boardId: Id<"boards">,
  userId: Id<"users">
): Promise<Doc<"boardMembers">> {
  const membership = await ctx.db
    .query("boardMembers")
    .withIndex("by_boardId_userId", (q) =>
      q.eq("boardId", boardId).eq("userId", userId)
    )
    .unique();
  if (!membership) throw new Error("Not authorized");
  return membership;
}

/**
 * Require that the user is the owner of the given board.
 * Returns the board document.
 */
export async function requireBoardOwner(
  ctx: QueryCtx | MutationCtx,
  boardId: Id<"boards">,
  userId: Id<"users">
): Promise<Doc<"boards">> {
  const board = await ctx.db.get(boardId);
  if (!board || board.ownerId !== userId) throw new Error("Not authorized");
  return board;
}
