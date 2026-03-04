import { mutation, query, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getNodesByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
  },
});

export const createNode = mutation({
  args: {
    boardId: v.id("boards"),
    type: v.union(v.literal("text"), v.literal("link")),
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    dimensions: v.optional(v.object({ width: v.number(), height: v.number() })),
    metadata: v.optional(
      v.object({
        title: v.optional(v.string()),
        favicon: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebaseUid", (q) => q.eq("firebaseUid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const now = Date.now();
    return await ctx.db.insert("nodes", {
      boardId: args.boardId,
      type: args.type,
      content: args.content,
      position: args.position,
      dimensions: args.dimensions ?? { width: 280, height: 120 },
      metadata: args.metadata,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateNode = mutation({
  args: {
    nodeId: v.id("nodes"),
    content: v.optional(v.string()),
    dimensions: v.optional(v.object({ width: v.number(), height: v.number() })),
    metadata: v.optional(
      v.object({
        title: v.optional(v.string()),
        favicon: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.content !== undefined) updates.content = args.content;
    if (args.dimensions !== undefined) updates.dimensions = args.dimensions;
    if (args.metadata !== undefined) updates.metadata = args.metadata;

    await ctx.db.patch(args.nodeId, updates);
  },
});

export const updateNodePosition = mutation({
  args: {
    nodeId: v.id("nodes"),
    position: v.object({ x: v.number(), y: v.number() }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.nodeId, {
      position: args.position,
      updatedAt: Date.now(),
    });
  },
});

export const deleteNode = mutation({
  args: { nodeId: v.id("nodes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(args.nodeId);
  },
});

// Internal mutation to update metadata (called from action, no auth needed)
export const patchNodeMetadata = internalMutation({
  args: {
    nodeId: v.id("nodes"),
    metadata: v.object({
      title: v.optional(v.string()),
      favicon: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) return;
    await ctx.db.patch(args.nodeId, {
      metadata: args.metadata,
      updatedAt: Date.now(),
    });
  },
});

// Action: fetch URL, parse OG/meta tags, update node
export const fetchLinkMetadata = action({
  args: { nodeId: v.id("nodes"), url: v.string() },
  handler: async (ctx, args) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(args.url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MagpaiBot/1.0; +https://magpai.app)",
          Accept: "text/html",
        },
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (!res.ok) {
        await ctx.runMutation(internal.nodes.patchNodeMetadata, {
          nodeId: args.nodeId,
          metadata: {},
        });
        return;
      }

      // Only read first 50KB to avoid huge payloads
      const reader = res.body?.getReader();
      if (!reader) {
        await ctx.runMutation(internal.nodes.patchNodeMetadata, {
          nodeId: args.nodeId,
          metadata: {},
        });
        return;
      }
      const chunks: Uint8Array[] = [];
      let totalSize = 0;
      const maxSize = 50_000;

      while (totalSize < maxSize) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalSize += value.length;
      }
      reader.cancel();

      const html = new TextDecoder().decode(
        chunks.reduce((acc, chunk) => {
          const merged = new Uint8Array(acc.length + chunk.length);
          merged.set(acc);
          merged.set(chunk, acc.length);
          return merged;
        }, new Uint8Array())
      );

      const title = extractMeta(html, "og:title") ||
        extractMeta(html, "twitter:title") ||
        extractTagContent(html, "title");

      const description = extractMeta(html, "og:description") ||
        extractMeta(html, "twitter:description") ||
        extractMeta(html, "description");

      let favicon = extractLink(html, "icon") ||
        extractLink(html, "shortcut icon");

      // Resolve relative favicon URLs
      if (favicon && !favicon.startsWith("http")) {
        try {
          const base = new URL(args.url);
          favicon = new URL(favicon, base.origin).href;
        } catch {
          favicon = undefined;
        }
      }

      await ctx.runMutation(internal.nodes.patchNodeMetadata, {
        nodeId: args.nodeId,
        metadata: {
          title: title || undefined,
          description: description ? description.slice(0, 200) : undefined,
          favicon: favicon || undefined,
        },
      });
    } catch {
      // Always mark as fetched so shimmer stops
      await ctx.runMutation(internal.nodes.patchNodeMetadata, {
        nodeId: args.nodeId,
        metadata: {},
      });
    }
  },
});

function extractMeta(html: string, property: string): string | undefined {
  // Match both property="..." and name="..." attributes
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*?)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*?)["'][^>]*(?:property|name)=["']${escapeRegex(property)}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return undefined;
}

function extractTagContent(html: string, tag: string): string | undefined {
  const match = html.match(
    new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i")
  );
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : undefined;
}

function extractLink(html: string, rel: string): string | undefined {
  const match = html.match(
    new RegExp(
      `<link[^>]*rel=["']${escapeRegex(rel)}["'][^>]*href=["']([^"']*?)["']`,
      "i"
    )
  );
  if (match?.[1]) return match[1];
  // Try reversed attribute order
  const match2 = html.match(
    new RegExp(
      `<link[^>]*href=["']([^"']*?)["'][^>]*rel=["']${escapeRegex(rel)}["']`,
      "i"
    )
  );
  return match2?.[1] || undefined;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
