import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// --- OAuth Client Registration ---

export const registerClient = mutation({
  args: {
    clientName: v.string(),
    redirectUris: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const clientId = crypto.randomUUID();
    const clientSecret = crypto.randomUUID();

    await ctx.db.insert("mcpOAuthClients", {
      clientId,
      clientSecret,
      clientName: args.clientName,
      redirectUris: args.redirectUris,
      createdAt: Date.now(),
    });

    return {
      client_id: clientId,
      client_secret: clientSecret,
      client_name: args.clientName,
      redirect_uris: args.redirectUris,
    };
  },
});

export const getClient = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mcpOAuthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();
  },
});

// --- Authorization Code ---

export const createAuthCode = mutation({
  args: {
    userId: v.id("users"),
    clientId: v.string(),
    redirectUri: v.string(),
    codeChallenge: v.string(),
    scope: v.string(),
  },
  handler: async (ctx, args) => {
    const code = crypto.randomUUID().replace(/-/g, "");

    await ctx.db.insert("mcpOAuthCodes", {
      code,
      userId: args.userId,
      clientId: args.clientId,
      redirectUri: args.redirectUri,
      codeChallenge: args.codeChallenge,
      scope: args.scope,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      used: false,
    });

    return code;
  },
});

export const exchangeAuthCode = mutation({
  args: {
    code: v.string(),
    clientId: v.string(),
    codeVerifier: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const authCode = await ctx.db
      .query("mcpOAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!authCode) return { error: "invalid_grant" };
    if (authCode.used) return { error: "invalid_grant" };
    if (authCode.expiresAt < Date.now()) return { error: "invalid_grant" };
    if (authCode.clientId !== args.clientId) return { error: "invalid_client" };
    if (authCode.redirectUri !== args.redirectUri)
      return { error: "invalid_grant" };

    // Verify PKCE code_challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(args.codeVerifier);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);
    const challenge = btoa(String.fromCharCode(...hashArray))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    if (challenge !== authCode.codeChallenge) {
      return { error: "invalid_grant" };
    }

    // Mark code as used
    await ctx.db.patch(authCode._id, { used: true });

    // Generate tokens
    const accessToken = crypto.randomUUID().replace(/-/g, "");
    const refreshToken = crypto.randomUUID().replace(/-/g, "");

    await ctx.db.insert("mcpOAuthTokens", {
      accessToken,
      refreshToken,
      userId: authCode.userId,
      clientId: args.clientId,
      scope: authCode.scope,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: authCode.scope,
    };
  },
});

export const refreshAccessToken = mutation({
  args: {
    refreshToken: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("mcpOAuthTokens")
      .withIndex("by_refreshToken", (q) =>
        q.eq("refreshToken", args.refreshToken)
      )
      .unique();

    if (!tokenRecord) return { error: "invalid_grant" };
    if (tokenRecord.revokedAt) return { error: "invalid_grant" };
    if (tokenRecord.clientId !== args.clientId)
      return { error: "invalid_client" };

    // Revoke old token
    await ctx.db.patch(tokenRecord._id, { revokedAt: Date.now() });

    // Generate new tokens
    const accessToken = crypto.randomUUID().replace(/-/g, "");
    const refreshToken = crypto.randomUUID().replace(/-/g, "");

    await ctx.db.insert("mcpOAuthTokens", {
      accessToken,
      refreshToken,
      userId: tokenRecord.userId,
      clientId: args.clientId,
      scope: tokenRecord.scope,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: tokenRecord.scope,
    };
  },
});

export const validateToken = query({
  args: { accessToken: v.string() },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("mcpOAuthTokens")
      .withIndex("by_accessToken", (q) =>
        q.eq("accessToken", args.accessToken)
      )
      .unique();

    if (!tokenRecord) return null;
    if (tokenRecord.revokedAt) return null;
    if (tokenRecord.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(tokenRecord.userId);
    if (!user) return null;

    return {
      userId: tokenRecord.userId,
      scope: tokenRecord.scope,
      user: { name: user.name, email: user.email },
    };
  },
});

export const revokeToken = mutation({
  args: { accessToken: v.string() },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("mcpOAuthTokens")
      .withIndex("by_accessToken", (q) =>
        q.eq("accessToken", args.accessToken)
      )
      .unique();

    if (tokenRecord) {
      await ctx.db.patch(tokenRecord._id, { revokedAt: Date.now() });
    }
  },
});

// Lookup user by Firebase UID (called from authorize page)
export const getUserByFirebaseUid = query({
  args: { firebaseUid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) =>
        q.eq("firebaseUid", args.firebaseUid)
      )
      .unique();
  },
});

// Cleanup expired codes and tokens (can be called from a cron)
export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Delete expired auth codes older than 1 hour
    const codes = await ctx.db.query("mcpOAuthCodes").collect();
    for (const code of codes) {
      if (code.expiresAt < now - 60 * 60 * 1000) {
        await ctx.db.delete(code._id);
      }
    }

    // Delete revoked tokens older than 24 hours
    const tokens = await ctx.db.query("mcpOAuthTokens").collect();
    for (const token of tokens) {
      if (token.revokedAt && token.revokedAt < now - 24 * 60 * 60 * 1000) {
        await ctx.db.delete(token._id);
      }
    }
  },
});
