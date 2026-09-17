import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthCouple, getAuthCouple } from "./helpers";

export const setTodayMood = mutation({
  args: {
    token: v.string(),
    mood: v.string(), // "happy" | "loved" | "okay" | "sad" | "tired" | "angry"
    note: v.optional(v.string()),
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const { user, couple } = await requireAuthCouple(ctx, args.token);

    const existingMood = await ctx.db
      .query("moods")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date)
      )
      .first();

    if (existingMood) {
      await ctx.db.patch(existingMood._id, {
        mood: args.mood,
        note: args.note,
        updatedAt: Date.now(),
      });
      return { moodId: existingMood._id, updated: true };
    } else {
      const moodId = await ctx.db.insert("moods", {
        coupleId: couple._id,
        userId: user._id,
        mood: args.mood,
        note: args.note,
        date: args.date,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { moodId, updated: false };
    }
  },
});

export const getTodayCoupleMoods = query({
  args: {
    token: v.optional(v.string()),
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return null;
    const { user, couple, partnerId } = auth;

    const myMood = await ctx.db
      .query("moods")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date)
      )
      .first();

    let partnerMood = null;
    let partnerUser = null;
    if (partnerId) {
      partnerMood = await ctx.db
        .query("moods")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", partnerId).eq("date", args.date)
        )
        .first();
      partnerUser = await ctx.db.get(partnerId);
    }

    return {
      myMood: myMood
        ? {
            mood: myMood.mood,
            note: myMood.note,
            updatedAt: myMood.updatedAt,
          }
        : null,
      partnerMood: partnerMood
        ? {
            mood: partnerMood.mood,
            note: partnerMood.note,
            updatedAt: partnerMood.updatedAt,
            userName: partnerUser?.name ?? "Partner",
          }
        : null,
      partnerName: partnerUser?.name ?? "Partner",
    };
  },
});

export const getMoodHistory = query({
  args: {
    token: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return [];
    const { user, couple } = auth;

    const moods = await ctx.db
      .query("moods")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(args.limit ?? 30);

    const userMap = new Map();
    for (const m of moods) {
      if (!userMap.has(m.userId)) {
        const u = await ctx.db.get(m.userId);
        userMap.set(m.userId, u?.name ?? "User");
      }
    }

    return moods.map((m) => ({
      _id: m._id,
      userId: m.userId,
      userName: userMap.get(m.userId),
      isMe: m.userId === user._id,
      mood: m.mood,
      note: m.note,
      date: m.date,
      createdAt: m.createdAt,
    }));
  },
});
