import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuthUser } from "./helpers";

export const generateAvatarUploadUrl = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthUser(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateProfile = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx, args.token);
    const updates: { name: string; avatarStorageId?: any } = {
      name: args.name.trim(),
    };

    if (args.avatarStorageId !== undefined) {
      updates.avatarStorageId = args.avatarStorageId;
    }

    await ctx.db.patch(user._id, updates);
    return { success: true };
  },
});
