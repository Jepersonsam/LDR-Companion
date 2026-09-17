import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  couples: defineTable({
    user1Id: v.id("users"),
    user2Id: v.optional(v.id("users")),
    startDate: v.string(), // ISO date e.g. 2024-02-14
    inviteCode: v.string(), // e.g. LDR-8F29KD
    status: v.union(v.literal("pending"), v.literal("active")),
    customTitle: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_inviteCode", ["inviteCode"])
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"]),

  messages: defineTable({
    coupleId: v.id("couples"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_couple", ["coupleId", "createdAt"]),

  moods: defineTable({
    coupleId: v.id("couples"),
    userId: v.id("users"),
    mood: v.string(), // "happy" | "loved" | "okay" | "sad" | "tired" | "angry"
    note: v.optional(v.string()),
    date: v.string(), // "YYYY-MM-DD"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_couple_date", ["coupleId", "date"])
    .index("by_user_date", ["userId", "date"])
    .index("by_couple", ["coupleId"]),

  journals: defineTable({
    coupleId: v.id("couples"),
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_couple", ["coupleId", "createdAt"]),

  memories: defineTable({
    coupleId: v.id("couples"),
    uploadedById: v.id("users"),
    storageId: v.id("_storage"),
    caption: v.string(),
    date: v.string(), // YYYY-MM-DD
    createdAt: v.number(),
  })
    .index("by_couple", ["coupleId", "createdAt"]),

  meetings: defineTable({
    coupleId: v.id("couples"),
    createdBy: v.id("users"),
    title: v.string(),
    targetDate: v.string(), // ISO string e.g. "2026-10-15T14:00:00"
    location: v.string(),
    notes: v.optional(v.string()),
    isNextMeeting: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_couple", ["coupleId", "targetDate"]),

  dailyQuestions: defineTable({
    questionText: v.string(),
    category: v.string(),
    dayNumber: v.number(),
  })
    .index("by_dayNumber", ["dayNumber"]),

  dailyAnswers: defineTable({
    questionId: v.id("dailyQuestions"),
    coupleId: v.id("couples"),
    userId: v.id("users"),
    answerText: v.string(),
    createdAt: v.number(),
  })
    .index("by_couple_question", ["coupleId", "questionId"])
    .index("by_couple_user_question", ["coupleId", "userId", "questionId"]),

  lovePings: defineTable({
    coupleId: v.id("couples"),
    senderId: v.id("users"),
    type: v.string(), // "heart" | "hug" | "kiss" | "miss_you"
    message: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_couple", ["coupleId", "createdAt"]),

  calls: defineTable({
    coupleId: v.id("couples"),
    callerId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(
      v.literal("ringing"),
      v.literal("ongoing"),
      v.literal("ended"),
      v.literal("declined"),
      v.literal("missed")
    ),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  })
    .index("by_couple", ["coupleId"])
    .index("by_couple_status", ["coupleId", "status"]),

  callSignals: defineTable({
    callId: v.id("calls"),
    senderId: v.id("users"),
    type: v.union(
      v.literal("offer"),
      v.literal("answer"),
      v.literal("candidate"),
      v.literal("heart_reaction")
    ),
    payload: v.string(), // JSON encoded SDP or candidate or reaction
    createdAt: v.number(),
  })
    .index("by_call", ["callId", "createdAt"]),
});
