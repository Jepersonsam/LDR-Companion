import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  generateToken,
  hashPassword,
  getAuthUser,
  getActiveCoupleForUser,
} from "./helpers";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const name = args.name.trim();

    if (!email || !email.includes("@")) {
      throw new Error("Please enter a valid email address.");
    }
    if (args.password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    if (!name) {
      throw new Error("Please enter your name.");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    const passwordHash = await hashPassword(args.password);
    const userId = await ctx.db.insert("users", {
      name,
      email,
      passwordHash,
      createdAt: Date.now(),
    });

    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      createdAt: Date.now(),
    });

    return { token, userId, name, email };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("Incorrect email or password.");
    }

    const passwordHash = await hashPassword(args.password);
    if (user.passwordHash !== passwordHash) {
      throw new Error("Incorrect email or password.");
    }

    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      createdAt: Date.now(),
    });

    return {
      token,
      userId: user._id,
      name: user.name,
      email: user.email,
    };
  },
});

export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});

export const getCurrentUser = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args.token);
    if (!user) return null;

    const couple = await getActiveCoupleForUser(ctx, user._id);
    let avatarUrl = null;
    if (user.avatarStorageId) {
      avatarUrl = await ctx.storage.getUrl(user.avatarStorageId);
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl,
      avatarStorageId: user.avatarStorageId,
      createdAt: user.createdAt,
      hasCouple: !!couple,
      coupleStatus: couple ? couple.status : null,
      coupleId: couple ? couple._id : null,
    };
  },
});
