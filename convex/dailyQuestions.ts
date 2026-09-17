import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthCouple, getAuthCouple } from "./helpers";

export const INITIAL_QUESTIONS = [
  { questionText: "Apa hal kecil yang membuat kamu tersenyum hari ini?", category: "Daily Life", dayNumber: 1 },
  { questionText: "Momen apa yang paling kamu rindukan saat kita bersama?", category: "Memories", dayNumber: 2 },
  { questionText: "Jika kita bisa liburan ke mana saja besok, ke mana kamu ingin pergi bersama?", category: "Dreams", dayNumber: 3 },
  { questionText: "Apa lagu yang selalu mengingatkanmu tentang hubungan kita?", category: "Music & Love", dayNumber: 4 },
  { questionText: "Apa hal baru yang ingin kamu pelajari atau coba bersama suatu hari nanti?", category: "Future", dayNumber: 5 },
  { questionText: "Kapan pertama kali kamu menyadari bahwa kamu sayang banget sama aku?", category: "Love Story", dayNumber: 6 },
  { questionText: "Apa makanan yang paling ingin kamu santap berdua saat kita ketemu nanti?", category: "Food & Fun", dayNumber: 7 },
  { questionText: "Apa film atau serial yang wajib kita tonton maraton bareng nanti?", category: "Entertainment", dayNumber: 8 },
  { questionText: "Bagaimana perasaanmu tentang perkembangan hubungan kita selama ini?", category: "Reflections", dayNumber: 9 },
  { questionText: "Apa satu kata atau kalimat yang ingin kamu dengar saat merasa lelah?", category: "Support", dayNumber: 10 },
  { questionText: "Apa kebiasaan kecil dari diriku yang menurutmu paling lucu atau menggemaskan?", category: "Affection", dayNumber: 11 },
  { questionText: "Apa rencana kencan impian kita untuk pertemuan berikutnya?", category: "Date Ideas", dayNumber: 12 },
  { questionText: "Apa pesan singkat yang ingin kamu sampaikan padaku sebelum tidur malam ini?", category: "Sweet Dreams", dayNumber: 13 },
  { questionText: "Apa harapan terbesarmu untuk kita berdua di masa depan?", category: "Future Together", dayNumber: 14 },
];

export const getTodayQuestionAndAnswers = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const auth = await getAuthCouple(ctx, args.token);
    if (!auth) return null;
    const { user, couple, partnerId } = auth;

    // Calculate day index based on couple start date or creation
    const createdTimestamp = couple.createdAt || Date.now();
    const daysSinceCreated = Math.max(
      0,
      Math.floor((Date.now() - createdTimestamp) / (24 * 60 * 60 * 1000))
    );
    const dayIndex = (daysSinceCreated % INITIAL_QUESTIONS.length) + 1;

    let question = await ctx.db
      .query("dailyQuestions")
      .withIndex("by_dayNumber", (q) => q.eq("dayNumber", dayIndex))
      .first();

    const preset = INITIAL_QUESTIONS.find((q) => q.dayNumber === dayIndex) ?? INITIAL_QUESTIONS[0];

    // Answers
    let myAnswerDoc = null;
    let partnerAnswerDoc = null;
    let partnerUser = null;

    if (question) {
      myAnswerDoc = await ctx.db
        .query("dailyAnswers")
        .withIndex("by_couple_user_question", (q) =>
          q
            .eq("coupleId", couple._id)
            .eq("userId", user._id)
            .eq("questionId", question._id)
        )
        .first();

      if (partnerId) {
        partnerAnswerDoc = await ctx.db
          .query("dailyAnswers")
          .withIndex("by_couple_user_question", (q) =>
            q
              .eq("coupleId", couple._id)
              .eq("userId", partnerId)
              .eq("questionId", question._id)
          )
          .first();
      }
    }

    if (partnerId) {
      partnerUser = await ctx.db.get(partnerId);
    }

    const hasMyAnswer = !!myAnswerDoc;
    const hasPartnerAnswer = !!partnerAnswerDoc;
    const bothAnswered = hasMyAnswer && hasPartnerAnswer;

    return {
      question: {
        _id: question?._id ?? null,
        questionText: question?.questionText ?? preset.questionText,
        category: question?.category ?? preset.category,
        dayNumber: question?.dayNumber ?? preset.dayNumber,
      },
      hasMyAnswer,
      hasPartnerAnswer,
      bothAnswered,
      myAnswer: myAnswerDoc
        ? {
            answerText: myAnswerDoc.answerText,
            createdAt: myAnswerDoc.createdAt,
          }
        : null,
      partnerAnswer: partnerAnswerDoc
        ? {
            // Only reveal partner's text if current user has answered!
            answerText: bothAnswered ? partnerAnswerDoc.answerText : null,
            partnerName: partnerUser?.name ?? "Partner",
            answeredAt: partnerAnswerDoc.createdAt,
            isRevealed: bothAnswered,
          }
        : null,
      partnerName: partnerUser?.name ?? "Partner",
    };
  },
});

export const submitDailyAnswer = mutation({
  args: {
    token: v.string(),
    dayNumber: v.optional(v.number()),
    answerText: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, couple } = await requireAuthCouple(ctx, args.token);

    const answerText = args.answerText.trim();
    if (!answerText) {
      throw new Error("Answer cannot be empty.");
    }

    // Determine day number
    const createdTimestamp = couple.createdAt || Date.now();
    const daysSinceCreated = Math.max(
      0,
      Math.floor((Date.now() - createdTimestamp) / (24 * 60 * 60 * 1000))
    );
    const dayNumber = args.dayNumber ?? ((daysSinceCreated % INITIAL_QUESTIONS.length) + 1);

    // Find or create dailyQuestion record in mutation
    let question = await ctx.db
      .query("dailyQuestions")
      .withIndex("by_dayNumber", (q) => q.eq("dayNumber", dayNumber))
      .first();

    if (!question) {
      const preset = INITIAL_QUESTIONS.find((q) => q.dayNumber === dayNumber) ?? INITIAL_QUESTIONS[0];
      const qId = await ctx.db.insert("dailyQuestions", {
        questionText: preset.questionText,
        category: preset.category,
        dayNumber: preset.dayNumber,
      });
      question = (await ctx.db.get(qId))!;
    }

    const existing = await ctx.db
      .query("dailyAnswers")
      .withIndex("by_couple_user_question", (q) =>
        q
          .eq("coupleId", couple._id)
          .eq("userId", user._id)
          .eq("questionId", question._id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        answerText,
      });
      return { answerId: existing._id, updated: true };
    }

    const answerId = await ctx.db.insert("dailyAnswers", {
      questionId: question._id,
      coupleId: couple._id,
      userId: user._id,
      answerText,
      createdAt: Date.now(),
    });

    return { answerId, updated: false };
  },
});
