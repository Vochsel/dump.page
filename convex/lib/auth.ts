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

export async function requireMcpToken(
  ctx: Ctx,
  accessToken: string
): Promise<{ userId: Id<"users">; scope: string }> {
  const tokenRecord = await ctx.db
    .query("mcpOAuthTokens")
    .withIndex("by_accessToken", (q) => q.eq("accessToken", accessToken))
    .unique();

  if (!tokenRecord) throw new Error("Invalid access token");
  if (tokenRecord.revokedAt) throw new Error("Token revoked");
  if (tokenRecord.expiresAt < Date.now()) throw new Error("Token expired");

  const user = await ctx.db.get(tokenRecord.userId);
  if (!user) throw new Error("User not found");

  return { userId: tokenRecord.userId, scope: tokenRecord.scope };
}

// SSRF protection: validate that a URL is safe to fetch.
// NOTE: This blocks known private IP literals and IPv6 ranges but cannot
// prevent DNS-rebinding attacks where a public hostname resolves to a
// private IP. Full DNS-resolution-based SSRF prevention requires an
// egress proxy or OS-level network policy.
const PRIVATE_IPV4_PATTERNS = [
  /^127\./,            // loopback
  /^10\./,             // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./, // RFC 1918
  /^192\.168\./,       // RFC 1918
  /^169\.254\./,       // link-local
  /^0\./,              // "this" network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT (RFC 6598)
  /^198\.1[89]\./,     // benchmarking (RFC 2544)
  /^192\.0\.0\./,      // IETF protocol assignments
  /^192\.0\.2\./,      // TEST-NET-1
  /^198\.51\.100\./,   // TEST-NET-2
  /^203\.0\.113\./,    // TEST-NET-3
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "[::1]",
  "0.0.0.0",
  "metadata.google.internal", // GCP metadata
  "metadata.google.com",
]);

// Private/reserved IPv6 prefixes (lowercase hex, after bracket-stripping)
const PRIVATE_IPV6_PREFIXES = [
  "::1",     // loopback
  "::ffff:", // IPv4-mapped (could wrap private IPv4)
  "fc",      // fc00::/7 — unique local (ULA)
  "fd",      // fc00::/7 — unique local (ULA)
  "fe8",     // fe80::/10 — link-local
  "fe9",     // fe80::/10
  "fea",     // fe80::/10
  "feb",     // fe80::/10
  "::",      // unspecified address
];

export function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) return false;

    // Strip brackets from IPv6
    const bare = hostname.replace(/^\[|\]$/g, "");

    // Check IPv6 private/reserved ranges
    if (bare.includes(":")) {
      for (const prefix of PRIVATE_IPV6_PREFIXES) {
        if (bare.startsWith(prefix)) return false;
      }
      // Block if the entire address is "::" (unspecified)
      if (bare === "::") return false;
    }

    // Check IPv4 private ranges
    for (const pattern of PRIVATE_IPV4_PATTERNS) {
      if (pattern.test(bare)) return false;
    }
    return true;
  } catch {
    return false;
  }
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
