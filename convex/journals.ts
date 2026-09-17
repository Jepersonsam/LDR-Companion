import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthCouple, getAuthCouple } from "./helpers";

export const listJournals = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return [];
    const { user, couple } = auth;

    const journals = await ctx.db
      .query("journals")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .collect();

    const authorIds = Array.from(new Set(journals.map((j) => j.authorId)));
    const authorMap = new Map();
    for (const aId of authorIds) {
      const u = await ctx.db.get(aId);
      authorMap.set(aId, u?.name ?? "Partner");
    }

    return journals.map((j) => ({
      _id: j._id,
      title: j.title,
      content: j.content,
      authorId: j.authorId,
      authorName: authorMap.get(j.authorId),
      isAuthor: j.authorId === user._id,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    }));
  },
});

export const createJournal = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, couple } = await requireAuthCouple(ctx, args.token);

    const title = args.title.trim();
    const content = args.content.trim();

    if (!title) {
      throw new Error("Please provide a title for your journal entry.");
    }
    if (!content) {
      throw new Error("Journal content cannot be empty.");
    }

    const journalId = await ctx.db.insert("journals", {
      coupleId: couple._id,
      authorId: user._id,
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return journalId;
  },
});

export const updateJournal = mutation({
  args: {
    token: v.string(),
    journalId: v.id("journals"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthCouple(ctx, args.token);
    const journal = await ctx.db.get(args.journalId);

    if (!journal) {
      throw new Error("Journal entry not found.");
    }

    if (journal.authorId !== user._id) {
      throw new Error("You can only edit your own journal entries.");
    }

    const title = args.title.trim();
    const content = args.content.trim();

    if (!title || !content) {
      throw new Error("Title and content are required.");
    }

    await ctx.db.patch(args.journalId, {
      title,
      content,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteJournal = mutation({
  args: {
    token: v.string(),
    journalId: v.id("journals"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuthCouple(ctx, args.token);
    const journal = await ctx.db.get(args.journalId);

    if (!journal) {
      throw new Error("Journal entry not found.");
    }

    if (journal.authorId !== user._id) {
      throw new Error("You can only delete your own journal entries.");
    }

    await ctx.db.delete(args.journalId);
    return { success: true };
  },
});
