import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthCouple, getAuthCouple } from "./helpers";

export const initiateCall = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, couple, partnerId } = await requireAuthCouple(ctx, args.token);

    if (!partnerId) {
      throw new Error("Pasangan belum bergabung.");
    }

    // Clean up any stale active calls older than 5 minutes
    const staleCalls = await ctx.db
      .query("calls")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "ringing"),
          q.eq(q.field("status"), "ongoing")
        )
      )
      .collect();

    for (const sc of staleCalls) {
      if (Date.now() - sc.createdAt > 5 * 60 * 1000) {
        await ctx.db.patch(sc._id, {
          status: "ended",
          endedAt: Date.now(),
        });
      }
    }

    const callId = await ctx.db.insert("calls", {
      coupleId: couple._id,
      callerId: user._id,
      receiverId: partnerId,
      status: "ringing",
      createdAt: Date.now(),
    });

    return { callId };
  },
});

export const acceptCall = mutation({
  args: {
    token: v.string(),
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const { user, couple } = await requireAuthCouple(ctx, args.token);
    const call = await ctx.db.get(args.callId);

    if (!call || call.coupleId !== couple._id) {
      throw new Error("Panggilan tidak ditemukan.");
    }

    if (call.status !== "ringing") {
      throw new Error("Panggilan sudah tidak aktif.");
    }

    await ctx.db.patch(args.callId, {
      status: "ongoing",
      startedAt: Date.now(),
    });

    return { success: true };
  },
});

export const declineCall = mutation({
  args: {
    token: v.string(),
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const { couple } = await requireAuthCouple(ctx, args.token);
    const call = await ctx.db.get(args.callId);

    if (!call || call.coupleId !== couple._id) {
      return { success: false };
    }

    await ctx.db.patch(args.callId, {
      status: "declined",
      endedAt: Date.now(),
    });

    return { success: true };
  },
});

export const endCall = mutation({
  args: {
    token: v.string(),
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const { couple } = await requireAuthCouple(ctx, args.token);
    const call = await ctx.db.get(args.callId);

    if (!call || call.coupleId !== couple._id) {
      return { success: false };
    }

    await ctx.db.patch(args.callId, {
      status: "ended",
      endedAt: Date.now(),
    });

    return { success: true };
  },
});

export const sendSignal = mutation({
  args: {
    token: v.string(),
    callId: v.id("calls"),
    type: v.union(
      v.literal("offer"),
      v.literal("answer"),
      v.literal("candidate"),
      v.literal("heart_reaction")
    ),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, couple } = await requireAuthCouple(ctx, args.token);
    const call = await ctx.db.get(args.callId);

    if (!call || call.coupleId !== couple._id) {
      throw new Error("Call not found.");
    }

    await ctx.db.insert("callSignals", {
      callId: args.callId,
      senderId: user._id,
      type: args.type,
      payload: args.payload,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const getActiveCall = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return null;
    const { user, couple, partnerId } = auth;

    // Look for active ringing or ongoing calls within last 30 minutes
    const threshold = Date.now() - 30 * 60 * 1000;
    const activeCalls = await ctx.db
      .query("calls")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(5);

    const activeCall = activeCalls.find(
      (c) =>
        (c.status === "ringing" || c.status === "ongoing") &&
        c.createdAt > threshold
    );

    if (!activeCall) return null;

    const caller = await ctx.db.get(activeCall.callerId);
    let callerAvatarUrl = null;
    if (caller?.avatarStorageId) {
      callerAvatarUrl = await ctx.storage.getUrl(caller.avatarStorageId);
    }

    return {
      _id: activeCall._id,
      status: activeCall.status,
      callerId: activeCall.callerId,
      callerName: caller?.name ?? "Pasangan",
      callerAvatarUrl,
      receiverId: activeCall.receiverId,
      isCaller: activeCall.callerId === user._id,
      createdAt: activeCall.createdAt,
      startedAt: activeCall.startedAt,
    };
  },
});

export const getCallSignals = query({
  args: {
    token: v.optional(v.string()),
    callId: v.optional(v.id("calls")),
  },
  handler: async (ctx, args) => {
    if (!args.token || !args.callId) return [];
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return [];
    const { user } = auth;

    const signals = await ctx.db
      .query("callSignals")
      .withIndex("by_call", (q) => q.eq("callId", args.callId!))
      .order("asc")
      .collect();

    return signals.map((s) => ({
      _id: s._id,
      type: s.type,
      payload: s.payload,
      senderId: s.senderId,
      isMe: s.senderId === user._id,
      createdAt: s.createdAt,
    }));
  },
});
