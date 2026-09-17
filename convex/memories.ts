import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthCouple, getAuthCouple } from "./helpers";

export const generateMemoryUploadUrl = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthCouple(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveMemory = mutation({
  args: {
    token: v.string(),
    storageId: v.id("_storage"),
    caption: v.string(),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const { user, couple } = await requireAuthCouple(ctx, args.token);

    const caption = args.caption.trim();
    if (!caption) {
      throw new Error("Please provide a caption for this memory.");
    }

    const memoryId = await ctx.db.insert("memories", {
      coupleId: couple._id,
      uploadedById: user._id,
      storageId: args.storageId,
      caption,
      date: args.date,
      createdAt: Date.now(),
    });

    return memoryId;
  },
});

export const listMemories = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return [];
    const { user, couple } = auth;

    const memories = await ctx.db
      .query("memories")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .collect();

    const uploaderIds = Array.from(new Set(memories.map((m) => m.uploadedById)));
    const uploaderMap = new Map();
    for (const uId of uploaderIds) {
      const u = await ctx.db.get(uId);
      uploaderMap.set(uId, u?.name ?? "Partner");
    }

    const resolved = [];
    for (const m of memories) {
      const imageUrl = await ctx.storage.getUrl(m.storageId);
      resolved.push({
        _id: m._id,
        imageUrl,
        storageId: m.storageId,
        caption: m.caption,
        date: m.date,
        uploadedById: m.uploadedById,
        uploaderName: uploaderMap.get(m.uploadedById),
        isUploader: m.uploadedById === user._id,
        createdAt: m.createdAt,
      });
    }

    return resolved;
  },
});

export const deleteMemory = mutation({
  args: {
    token: v.string(),
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args) => {
    const { couple } = await requireAuthCouple(ctx, args.token);
    const memory = await ctx.db.get(args.memoryId);

    if (!memory || memory.coupleId !== couple._id) {
      throw new Error("Memory not found.");
    }

    try {
      await ctx.storage.delete(memory.storageId);
    } catch {
      // Ignore if already deleted
    }

    await ctx.db.delete(args.memoryId);
    return { success: true };
  },
});
