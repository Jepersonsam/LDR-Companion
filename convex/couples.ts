import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  generateInviteCode,
  requireAuthUser,
  getActiveCoupleForUser,
  requireAuthCouple,
  getAuthCouple,
} from "./helpers";

export const createCouple = mutation({
  args: {
    token: v.string(),
    startDate: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx, args.token);

    const existingCouple = await getActiveCoupleForUser(ctx, user._id);
    if (existingCouple) {
      throw new Error("You already have an active or pending relationship.");
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await ctx.db
        .query("couples")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .first();
      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    const coupleId = await ctx.db.insert("couples", {
      user1Id: user._id,
      startDate: args.startDate,
      inviteCode,
      status: "pending",
      createdAt: Date.now(),
    });

    return { coupleId, inviteCode };
  },
});

export const joinCouple = mutation({
  args: {
    token: v.string(),
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx, args.token);

    const existingCouple = await getActiveCoupleForUser(ctx, user._id);
    if (existingCouple) {
      throw new Error("You already have an active relationship. Leave or delete it before joining another.");
    }

    const cleanedCode = args.inviteCode.trim().toUpperCase();
    const targetCouple = await ctx.db
      .query("couples")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", cleanedCode))
      .first();

    if (!targetCouple) {
      throw new Error("Invitation code not found. Please check and try again.");
    }

    if (targetCouple.user1Id === user._id) {
      throw new Error("You cannot join your own relationship invite code.");
    }

    if (targetCouple.user2Id) {
      throw new Error("This relationship already has two partners.");
    }

    await ctx.db.patch(targetCouple._id, {
      user2Id: user._id,
      status: "active",
    });

    return { coupleId: targetCouple._id, success: true };
  },
});

export const getMyCouple = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const user = await requireAuthUser(ctx, args.token);
    const couple = await getActiveCoupleForUser(ctx, user._id);
    if (!couple) return null;

    const isUser1 = couple.user1Id === user._id;
    const partnerId = isUser1 ? couple.user2Id : couple.user1Id;

    const user1 = await ctx.db.get(couple.user1Id);
    let user1Avatar = null;
    if (user1?.avatarStorageId) {
      user1Avatar = await ctx.storage.getUrl(user1.avatarStorageId);
    }

    let user2 = null;
    let user2Avatar = null;
    if (couple.user2Id) {
      user2 = await ctx.db.get(couple.user2Id);
      if (user2?.avatarStorageId) {
        user2Avatar = await ctx.storage.getUrl(user2.avatarStorageId);
      }
    }

    const partner = partnerId ? await ctx.db.get(partnerId) : null;
    let partnerAvatar = null;
    if (partner?.avatarStorageId) {
      partnerAvatar = await ctx.storage.getUrl(partner.avatarStorageId);
    }

    return {
      _id: couple._id,
      startDate: couple.startDate,
      inviteCode: couple.inviteCode,
      status: couple.status,
      customTitle: couple.customTitle,
      createdAt: couple.createdAt,
      isUser1,
      currentUser: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: isUser1 ? user1Avatar : user2Avatar,
      },
      partner: partner
        ? {
            _id: partner._id,
            name: partner.name,
            email: partner.email,
            avatarUrl: partnerAvatar,
          }
        : null,
      user1: user1
        ? {
            _id: user1._id,
            name: user1.name,
            avatarUrl: user1Avatar,
          }
        : null,
      user2: user2
        ? {
            _id: user2._id,
            name: user2.name,
            avatarUrl: user2Avatar,
          }
        : null,
    };
  },
});

export const updateStartDate = mutation({
  args: {
    token: v.string(),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { couple } = await requireAuthCouple(ctx, args.token);
    await ctx.db.patch(couple._id, {
      startDate: args.startDate,
    });
    return { success: true };
  },
});

export const sendLovePing = mutation({
  args: {
    token: v.string(),
    type: v.string(), // "heart" | "hug" | "kiss" | "miss_you"
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, couple } = await requireAuthCouple(ctx, args.token);
    const pingId = await ctx.db.insert("lovePings", {
      coupleId: couple._id,
      senderId: user._id,
      type: args.type,
      message: args.message,
      createdAt: Date.now(),
    });
    return pingId;
  },
});

export const getRecentLovePings = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return [];

    const pings = await ctx.db
      .query("lovePings")
      .withIndex("by_couple", (q) => q.eq("coupleId", auth.couple._id))
      .order("desc")
      .take(10);

    return pings.map((ping) => ({
      ...ping,
      isSender: ping.senderId === auth.user._id,
    }));
  },
});
