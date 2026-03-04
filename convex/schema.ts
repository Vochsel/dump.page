import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firebaseUid: v.string(),
    email: v.string(),
    name: v.string(),
    profileImage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_firebaseUid", ["firebaseUid"])
    .index("by_email", ["email"]),

  boards: defineTable({
    name: v.string(),
    icon: v.string(),
    ownerId: v.id("users"),
    visibility: v.union(
      v.literal("private"),
      v.literal("shared"),
      v.literal("public")
    ),
    shareToken: v.optional(v.string()),
    settings: v.optional(
      v.object({
        backgroundPattern: v.optional(
          v.union(
            v.literal("dots"),
            v.literal("paper"),
            v.literal("boxes"),
            v.literal("blank")
          )
        ),
        backgroundColor: v.optional(v.string()),
        controlsVariant: v.optional(
          v.union(v.literal("default"), v.literal("map"))
        ),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_shareToken", ["shareToken"]),

  boardMembers: defineTable({
    boardId: v.id("boards"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("editor")),
    joinedAt: v.number(),
  })
    .index("by_boardId", ["boardId"])
    .index("by_userId", ["userId"])
    .index("by_boardId_userId", ["boardId", "userId"]),

  nodes: defineTable({
    boardId: v.id("boards"),
    type: v.union(v.literal("text"), v.literal("link"), v.literal("checklist")),
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    dimensions: v.object({ width: v.number(), height: v.number() }),
    metadata: v.optional(
      v.object({
        title: v.optional(v.string()),
        favicon: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_boardId", ["boardId"]),
});
