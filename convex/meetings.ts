import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthCouple, getAuthCouple } from "./helpers";

export const listMeetings = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return [];
    const { couple } = auth;

    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .collect();

    // Sort by targetDate ascending
    return meetings.sort((a, b) =>
      new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    );
  },
});

export const getNextMeeting = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return null;
    const { couple } = auth;

    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .collect();

    if (meetings.length === 0) return null;

    // Check if explicitly marked as next meeting
    const explicitNext = meetings.find((m) => m.isNextMeeting);
    if (explicitNext) return explicitNext;

    // Otherwise find the soonest future meeting
    const now = Date.now();
    const futureMeetings = meetings
      .filter((m) => new Date(m.targetDate).getTime() >= now)
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

    if (futureMeetings.length > 0) return futureMeetings[0];

    // Fallback to most recent meeting
    return meetings.sort(
      (a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime()
    )[0];
  },
});

export const createMeeting = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    targetDate: v.string(), // ISO string e.g. "2026-10-29T18:00:00"
    location: v.string(),
    notes: v.optional(v.string()),
    isNextMeeting: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user, couple } = await requireAuthCouple(ctx, args.token);

    const title = args.title.trim();
    const location = args.location.trim();

    if (!title) {
      throw new Error("Meeting title is required.");
    }
    if (!args.targetDate) {
      throw new Error("Target date is required.");
    }
    if (!location) {
      throw new Error("Location is required.");
    }

    if (args.isNextMeeting) {
      const existing = await ctx.db
        .query("meetings")
        .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
        .collect();
      for (const m of existing) {
        if (m.isNextMeeting) {
          await ctx.db.patch(m._id, { isNextMeeting: false });
        }
      }
    }

    const meetingId = await ctx.db.insert("meetings", {
      coupleId: couple._id,
      createdBy: user._id,
      title,
      targetDate: args.targetDate,
      location,
      notes: args.notes,
      isNextMeeting: args.isNextMeeting,
      createdAt: Date.now(),
    });

    return meetingId;
  },
});

export const setAsNextMeeting = mutation({
  args: {
    token: v.string(),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const { couple } = await requireAuthCouple(ctx, args.token);

    const target = await ctx.db.get(args.meetingId);
    if (!target || target.coupleId !== couple._id) {
      throw new Error("Meeting not found.");
    }

    const all = await ctx.db
      .query("meetings")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .collect();

    for (const m of all) {
      await ctx.db.patch(m._id, {
        isNextMeeting: m._id === args.meetingId,
      });
    }

    return { success: true };
  },
});

export const deleteMeeting = mutation({
  args: {
    token: v.string(),
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const { couple } = await requireAuthCouple(ctx, args.token);
    const meeting = await ctx.db.get(args.meetingId);

    if (!meeting || meeting.coupleId !== couple._id) {
      throw new Error("Meeting not found.");
    }

    await ctx.db.delete(args.meetingId);
    return { success: true };
  },
});
