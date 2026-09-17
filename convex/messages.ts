import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthCouple, getAuthCouple } from "./helpers";

export const listMessages = query({
  args: {
    token: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return [];
    const { user, couple } = auth;

    const limit = args.limit ?? 100;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(limit);

    // Fetch senders info
    const senderIds = Array.from(new Set(messages.map((m) => m.senderId)));
    const sendersMap = new Map();
    for (const sId of senderIds) {
      const u = await ctx.db.get(sId);
      if (u) {
        let avatarUrl = null;
        if (u.avatarStorageId) {
          avatarUrl = await ctx.storage.getUrl(u.avatarStorageId);
        }
        sendersMap.set(sId, { name: u.name, avatarUrl });
      }
    }

    return messages
      .reverse()
      .map((msg) => {
        const sender = sendersMap.get(msg.senderId);
        return {
          _id: msg._id,
          content: msg.content,
          senderId: msg.senderId,
          senderName: sender?.name ?? "Partner",
          senderAvatarUrl: sender?.avatarUrl ?? null,
          isSender: msg.senderId === user._id,
          createdAt: msg.createdAt,
        };
      });
  },
});

export const sendMessage = mutation({
  args: {
    token: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, couple } = await requireAuthCouple(ctx, args.token);
    const content = args.content.trim();
    if (!content) {
      throw new Error("Message content cannot be empty.");
    }

    const messageId = await ctx.db.insert("messages", {
      coupleId: couple._id,
      senderId: user._id,
      content,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: {
    token: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthCouple(ctx, args.token);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found.");
    }

    if (message.senderId !== user._id) {
      throw new Error("You can only delete your own messages.");
    }

    await ctx.db.delete(args.messageId);
    return { success: true };
  },
});

export const updatePresence = mutation({
  args: {
    token: v.string(),
    inChat: v.boolean(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return { success: false };
    const { user, couple } = auth;

    const existing = await ctx.db
      .query("chatPresence")
      .withIndex("by_couple_user", (q) =>
        q.eq("coupleId", couple._id).eq("userId", user._id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        inChat: args.inChat,
        isTyping: args.isTyping,
        lastActive: Date.now(),
      });
    } else {
      await ctx.db.insert("chatPresence", {
        coupleId: couple._id,
        userId: user._id,
        inChat: args.inChat,
        isTyping: args.isTyping,
        lastActive: Date.now(),
      });
    }

    return { success: true };
  },
});

export const getPartnerPresence = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth || !auth.partnerId) return null;
    const { couple, partnerId } = auth;

    const presence = await ctx.db
      .query("chatPresence")
      .withIndex("by_couple_user", (q) =>
        q.eq("coupleId", couple._id).eq("userId", partnerId)
      )
      .first();

    if (!presence) {
      return { inChat: false, isTyping: false, lastActive: 0 };
    }

    const now = Date.now();
    // Typing is active if within last 5 seconds
    const isTyping = presence.isTyping && now - presence.lastActive < 5000;
    // In chat is active if within last 25 seconds
    const inChat = presence.inChat && now - presence.lastActive < 25000;

    return {
      inChat,
      isTyping,
      lastActive: presence.lastActive,
    };
  },
});
