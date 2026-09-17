"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Heart,
  Send,
  HelpCircle,
  PartyPopper,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function DailyQuestionPage() {
  const { user, couple, token, isLoading } = useAuth();
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const data = useQuery(
    api.dailyQuestions.getTodayQuestionAndAnswers,
    token ? { token } : "skip"
  );

  const submitAnswerMutation = useMutation(
    api.dailyQuestions.submitDailyAnswer
  );

  useEffect(() => {
    if (data?.myAnswer) {
      setAnswerText(data.myAnswer.answerText);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !data?.question || !answerText.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      await submitAnswerMutation({
        token,
        dayNumber: data?.question?.dayNumber ?? 1,
        answerText: answerText.trim(),
      });

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.4 },
        colors: ["#fb7185", "#f43f5e", "#ec4899", "#8b5cf6"],
      });
    } catch (err: any) {
      setError(err?.message || "Gagal mengirim jawaban.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !couple) {
    return <LoadingSpinner message="Membuka pertanyaan harian..." />;
  }

  const partnerName = couple.partner?.name ?? "Partner";
  const question = data?.question;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="rose" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Daily Connection</span>
          </Badge>
          <span className="text-xs text-stone-400">
            Pertanyaan #{question?.dayNumber ?? 1} • {question?.category}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 mt-2">
          Daily Question & Dual-Reveal
        </h1>
        <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Satu pertanyaan romantis setiap hari. Jawaban pasangan akan terbuka secara otomatis setelah kamu menjawab!
        </p>
      </div>

      {/* Main Question Card */}
      <Card variant="glow" padding="lg" className="border-rose-300">
        <div className="text-center py-4 space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-500 shadow-inner">
            <HelpCircle className="h-6 w-6 text-rose-500 animate-pulse" />
          </div>

          <h2 className="text-xl md:text-2xl font-black text-stone-900 dark:text-stone-100 max-w-xl mx-auto leading-relaxed">
            &ldquo;{question?.questionText}&rdquo;
          </h2>

          <div className="inline-flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full">
            {data?.bothAnswered ? (
              <>
                <PartyPopper className="h-4 w-4" />
                <span>Kedua Jawaban Terbuka (Revealed!)</span>
              </>
            ) : data?.hasMyAnswer ? (
              <>
                <Unlock className="h-4 w-4" />
                <span>Kamu sudah menjawab! Menunggu {partnerName}...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Jawab terlebih dahulu untuk membuka jawaban pasangan</span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Answers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current User Answer Card */}
        <Card variant="glass" padding="md">
          <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-950 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar name={user?.name ?? "Me"} src={user?.avatarUrl} size="xs" ring />
              <CardTitle className="text-sm font-bold">Jawabanmu</CardTitle>
            </div>
            {data?.hasMyAnswer && (
              <Badge variant="emerald" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Terkirim</span>
              </Badge>
            )}
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                rows={4}
                placeholder="Tuliskan jawaban tulusmu di sini..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                required
                className="w-full rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-white/70 dark:bg-stone-900/60 p-3.5 text-xs md:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <Button
                type="submit"
                variant="romantic"
                size="md"
                isLoading={isSubmitting}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                <span>{data?.hasMyAnswer ? "Perbarui Jawaban" : "Kirim Jawaban & Buka"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Partner Answer Card (with Dual-Reveal blur/lock) */}
        <Card variant="glass" padding="md">
          <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-950 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar
                name={partnerName}
                src={couple.partner?.avatarUrl}
                size="xs"
                ring
              />
              <CardTitle className="text-sm font-bold">
                Jawaban {partnerName}
              </CardTitle>
            </div>
            {data?.hasPartnerAnswer ? (
              <Badge variant="pink">Sudah Menjawab</Badge>
            ) : (
              <Badge variant="outline">Belum Menjawab</Badge>
            )}
          </CardHeader>

          <CardContent className="pt-4">
            {data?.bothAnswered && data.partnerAnswer?.answerText ? (
              /* Both Answered -> FULL REVEAL */
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 space-y-2 animate-in fade-in">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 whitespace-pre-wrap leading-relaxed">
                  &ldquo;{data.partnerAnswer.answerText}&rdquo;
                </p>
                <div className="text-[10px] text-stone-400 text-right">
                  Dijawab {formatRelativeTime(data.partnerAnswer.answeredAt)}
                </div>
              </div>
            ) : (
              /* Hidden / Locked State */
              <div className="relative p-6 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-dashed border-stone-200 dark:border-stone-800 text-center overflow-hidden">
                <div className="space-y-3 filter blur-sm select-none opacity-40">
                  <p className="text-sm">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                  </p>
                  <p className="text-xs">
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                  </p>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xs">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 mb-2 shadow-md">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {data?.hasMyAnswer
                      ? `Menunggu ${partnerName} menjawab...`
                      : "Jawaban Masih Terkunci"}
                  </h4>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 max-w-xs text-center">
                    {data?.hasMyAnswer
                      ? "Begitu pasanganmu menjawab, jawaban akan langsung terbuka realtime di sini."
                      : "Kirim jawabanmu di samping untuk membuka mekanisme reveal."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
