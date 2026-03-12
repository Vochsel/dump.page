import { mutation, query, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { checkBoardReadAccess, requireBoardMember, requireBoardWriteAccess, isUrlSafe } from "./lib/auth";

export const getNodesByBoard = query({
  args: {
    boardId: v.id("boards"),
    shareToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const canRead = await checkBoardReadAccess(ctx, args.boardId, args.shareToken);
    if (!canRead) return [];

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
    return nodes.filter((n) => !n.archived);
  },
});

export const getArchivedNodesByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    await requireBoardMember(ctx, args.boardId);

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
    return nodes.filter((n) => n.archived);
  },
});

export const archiveNode = mutation({
  args: { nodeId: v.id("nodes") },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) throw new Error("Node not found");
    await requireBoardWriteAccess(ctx, node.boardId);
    await ctx.db.patch(args.nodeId, { archived: true, updatedAt: Date.now() });
  },
});

export const unarchiveNode = mutation({
  args: { nodeId: v.id("nodes") },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) throw new Error("Node not found");
    await requireBoardWriteAccess(ctx, node.boardId);
    await ctx.db.patch(args.nodeId, { archived: false, updatedAt: Date.now() });
  },
});

export const createNode = mutation({
  args: {
    boardId: v.id("boards"),
    type: v.union(v.literal("text"), v.literal("link"), v.literal("checklist")),
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    dimensions: v.optional(v.object({ width: v.number(), height: v.number() })),
    metadata: v.optional(
      v.object({
        title: v.optional(v.string()),
        favicon: v.optional(v.string()),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireBoardWriteAccess(ctx, args.boardId);

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
    title: v.optional(v.string()),
    showTitle: v.optional(v.boolean()),
    collapsed: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
    docPosition: v.optional(v.object({ x: v.number(), y: v.number() })),
    dimensions: v.optional(v.object({ width: v.number(), height: v.number() })),
    metadata: v.optional(
      v.object({
        title: v.optional(v.string()),
        favicon: v.optional(v.string()),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) throw new Error("Node not found");
    await requireBoardWriteAccess(ctx, node.boardId);

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.content !== undefined) updates.content = args.content;
    if (args.title !== undefined) updates.title = args.title;
    if (args.showTitle !== undefined) updates.showTitle = args.showTitle;
    if (args.collapsed !== undefined) updates.collapsed = args.collapsed;
    if (args.archived !== undefined) updates.archived = args.archived;
    if (args.docPosition !== undefined) updates.docPosition = args.docPosition;
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
    const node = await ctx.db.get(args.nodeId);
    if (!node) throw new Error("Node not found");
    await requireBoardWriteAccess(ctx, node.boardId);

    await ctx.db.patch(args.nodeId, {
      position: args.position,
      updatedAt: Date.now(),
    });
  },
});

export const deleteNode = mutation({
  args: { nodeId: v.id("nodes") },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) throw new Error("Node not found");
    await requireBoardWriteAccess(ctx, node.boardId);

    await ctx.db.delete(args.nodeId);

    // Cascade-delete edges referencing this node
    const edgesBySource = await ctx.db
      .query("edges")
      .withIndex("by_source", (q) => q.eq("source", args.nodeId))
      .collect();
    const edgesByTarget = await ctx.db
      .query("edges")
      .withIndex("by_target", (q) => q.eq("target", args.nodeId))
      .collect();
    for (const edge of [...edgesBySource, ...edgesByTarget]) {
      await ctx.db.delete(edge._id);
    }
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
      image: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) return;
    // Merge with existing metadata — only overwrite fields the fetch actually found
    const existing = node.metadata ?? {};
    const merged = { ...existing, ...args.metadata };
    // Keep existing values for fields the fetch didn't find
    if (!args.metadata.title && existing.title) merged.title = existing.title;
    if (!args.metadata.description && existing.description) merged.description = existing.description;
    await ctx.db.patch(args.nodeId, {
      metadata: merged,
      updatedAt: Date.now(),
    });
  },
});

// Public mutation: validates access & URL, then schedules internal action
export const requestFetchLinkMetadata = mutation({
  args: { nodeId: v.id("nodes"), url: v.string() },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) throw new Error("Node not found");
    await requireBoardWriteAccess(ctx, node.boardId);

    if (!isUrlSafe(args.url)) {
      throw new Error("URL is not allowed");
    }

    await ctx.scheduler.runAfter(0, internal.nodes.fetchLinkMetadata, {
      nodeId: args.nodeId,
      url: args.url,
    });
  },
});

/** Parse a dump.page board URL and return the slug, or null if not a dump.page board link. */
function parseDumpPageSlug(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "dump.page" && u.hostname !== "www.dump.page") return null;
    const match = u.pathname.match(/^\/b\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Internal query: look up a board name + thumbnail by slug (no auth — server-side only)
export const getBoardNameBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    let board = await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!board) {
      try {
        board = await ctx.db.get(args.slug as Id<"boards">);
      } catch {
        // Not a valid ID
      }
    }
    if (!board) return null;
    const icon = board.icon && !board.icon.startsWith("lucide:") ? `${board.icon} ` : "";
    let thumbnailUrl: string | null = null;
    if (board.thumbnailStorageId) {
      thumbnailUrl = await ctx.storage.getUrl(board.thumbnailStorageId);
    }
    return { name: `${icon}${board.name}`, thumbnailUrl };
  },
});

// Internal action: fetch URL, parse OG/meta tags, update node
export const fetchLinkMetadata = internalAction({
  args: { nodeId: v.id("nodes"), url: v.string() },
  handler: async (ctx, args) => {
    // For dump.page board URLs, look up the board name directly from the DB.
    // This works for private, shared, and public boards since it's an internal query.
    const dumpSlug = parseDumpPageSlug(args.url);
    let dumpBoardName: string | undefined;
    let dumpThumbnailUrl: string | undefined;
    if (dumpSlug) {
      const result = await ctx.runQuery(internal.nodes.getBoardNameBySlug, { slug: dumpSlug });
      if (result) {
        dumpBoardName = result.name;
        if (result.thumbnailUrl) dumpThumbnailUrl = result.thumbnailUrl;
      }
    }

    // For dump.page links, skip HTTP fetch — use internal data directly
    if (dumpSlug && dumpBoardName) {
      await ctx.runMutation(internal.nodes.patchNodeMetadata, {
        nodeId: args.nodeId,
        metadata: {
          title: dumpBoardName,
          description: "dump.page",
          image: dumpThumbnailUrl || undefined,
          favicon: "https://www.dump.page/favicon.ico",
        },
      });
      return;
    }

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

      // Post-redirect SSRF check: verify final URL is still safe
      if (res.url && !isUrlSafe(res.url)) {
        await ctx.runMutation(internal.nodes.patchNodeMetadata, {
          nodeId: args.nodeId,
          metadata: {
            title: dumpBoardName || undefined,
            description: dumpBoardName ? "dump.page" : undefined,
          },
        });
        return;
      }

      if (!res.ok) {
        await ctx.runMutation(internal.nodes.patchNodeMetadata, {
          nodeId: args.nodeId,
          metadata: {
            title: dumpBoardName || undefined,
            description: dumpBoardName ? "dump.page" : undefined,
          },
        });
        return;
      }

      // Only read first 50KB to avoid huge payloads
      const reader = res.body?.getReader();
      if (!reader) {
        await ctx.runMutation(internal.nodes.patchNodeMetadata, {
          nodeId: args.nodeId,
          metadata: {
            title: dumpBoardName || undefined,
            description: dumpBoardName ? "dump.page" : undefined,
          },
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

      let title = extractMeta(html, "og:title") ||
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

      let image = extractMeta(html, "og:image") ||
        extractMeta(html, "twitter:image");

      if (image && !image.startsWith("http")) {
        try {
          const base = new URL(args.url);
          image = new URL(image, base.origin).href;
        } catch {
          image = undefined;
        }
      }

      // For dump.page links, prefer the internal DB name over OG title
      if (dumpBoardName) {
        title = dumpBoardName;
      }

      await ctx.runMutation(internal.nodes.patchNodeMetadata, {
        nodeId: args.nodeId,
        metadata: {
          title: title || undefined,
          description: (dumpBoardName ? "dump.page" : undefined) ||
            (description ? description.slice(0, 200) : undefined),
          favicon: favicon || undefined,
          image: image || undefined,
        },
      });
    } catch {
      // Always mark as fetched so shimmer stops.
      // For dump.page links, still use the DB-resolved name if available.
      await ctx.runMutation(internal.nodes.patchNodeMetadata, {
        nodeId: args.nodeId,
        metadata: {
          title: dumpBoardName || undefined,
          description: dumpBoardName ? "dump.page" : undefined,
        },
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
