"use client";

import React, { useState, useEffect } from "react";
import { Smile, Heart, Calendar, Sparkles, Check, Clock } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MOODS, getMoodInfo } from "@/lib/moodConfig";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function MoodTrackerPage() {
  const { user, couple, token, isLoading } = useAuth();
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedMood, setSelectedMood] = useState<string>("happy");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const todayMoods = useQuery(
    api.moods.getTodayCoupleMoods,
    token ? { token, date: todayStr } : "skip"
  );

  const moodHistory = useQuery(
    api.moods.getMoodHistory,
    token ? { token, limit: 30 } : "skip"
  );

  const setTodayMoodMutation = useMutation(api.moods.setTodayMood);

  useEffect(() => {
    if (todayMoods?.myMood) {
      setSelectedMood(todayMoods.myMood.mood);
      setNote(todayMoods.myMood.note || "");
    }
  }, [todayMoods]);

  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);

    try {
      await setTodayMoodMutation({
        token,
        mood: selectedMood,
        note: note.trim() || undefined,
        date: todayStr,
      });

      setSavedSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.4 },
        colors: ["#fbbf24", "#f43f5e", "#ec4899"],
      });

      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !couple) {
    return <LoadingSpinner message="Memuat mood tracker..." />;
  }

  const partnerName = couple.partner?.name ?? "Partner";
  const partnerMoodInfo = getMoodInfo(todayMoods?.partnerMood?.mood);
  const myMoodInfo = getMoodInfo(todayMoods?.myMood?.mood);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Smile className="h-7 w-7 text-amber-500" />
          <span>Daily Mood Tracker</span>
        </h1>
        <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Ketahui perasaan satu sama lain setiap hari meskipun terpisah jarak.
        </p>
      </div>

      {/* Today Mood Cards Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Partner's Today Mood Status */}
        <Card variant="glass" padding="md" className="relative overflow-hidden">
          <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={partnerName}
                  src={couple.partner?.avatarUrl}
                  size="sm"
                  ring
                />
                <div>
                  <CardTitle className="text-sm font-bold">
                    Mood {partnerName} Hari Ini
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    {todayMoods?.partnerMood
                      ? `Diperbarui ${formatRelativeTime(todayMoods.partnerMood.updatedAt)}`
                      : "Belum mengisi mood"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {todayMoods?.partnerMood ? (
              <div className={`p-4 rounded-2xl border ${partnerMoodInfo.bgColor} ${partnerMoodInfo.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-stone-500">Status:</span>
                    <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                      {partnerMoodInfo.label}
                    </h3>
                  </div>
                  <span className="text-4xl">{partnerMoodInfo.emoji}</span>
                </div>

                {todayMoods.partnerMood.note && (
                  <p className="mt-3 text-xs italic text-stone-700 dark:text-stone-300 border-t border-stone-200/50 pt-2">
                    &ldquo;{todayMoods.partnerMood.note}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-dashed border-stone-200 dark:border-stone-800">
                <span className="text-3xl block mb-2">⏳</span>
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  {partnerName} belum update mood hari ini
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Kirimkan pesan untuk menyapa harinya!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Set My Today Mood Form */}
        <Card variant="glow" padding="md" className="border-rose-300">
          <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-950">
            <CardTitle className="text-sm font-bold">
              Bagaimana Perasaanmu Hari Ini, {user?.name}?
            </CardTitle>
            <CardDescription className="text-[11px]">
              Pilih satu mood untuk dibagikan ke pasangan
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSaveMood} className="space-y-4">
              {/* 6 Mood Options Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {MOODS.map((m) => {
                  const isSelected = selectedMood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMood(m.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all cursor-pointer border ${
                        isSelected
                          ? `${m.bgActive} border-transparent shadow-md scale-102`
                          : "bg-white/60 dark:bg-stone-800/60 border-rose-100 dark:border-rose-900/40 hover:bg-white dark:hover:bg-stone-800"
                      }`}
                    >
                      <span className="text-2xl mb-1">{m.emoji}</span>
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Catatan singkat (opsional):
                </label>
                <input
                  type="text"
                  placeholder="Ceritakan sedikit perasaanmu hari ini..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-white/70 dark:bg-stone-900/60 px-3.5 py-2 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
                />
              </div>

              <Button
                type="submit"
                variant="romantic"
                size="md"
                isLoading={isSaving}
                className="w-full gap-2"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Mood Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 fill-white" />
                    <span>Simpan Mood Hari Ini</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Mood History Timeline */}
      <Card variant="glass" padding="md">
        <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-950">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-rose-500" />
            <CardTitle className="text-sm font-bold">
              Riwayat Mood Bersama (30 Hari Terakhir)
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {moodHistory && moodHistory.length > 0 ? (
            <div className="space-y-3">
              {moodHistory.map((entry) => {
                const info = getMoodInfo(entry.mood);
                return (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-rose-100 dark:border-rose-950/60 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {entry.userName} {entry.isMe ? "(Kamu)" : ""}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                        {entry.note ? (
                          <p className="text-stone-600 dark:text-stone-300 mt-0.5 italic">
                            &ldquo;{entry.note}&rdquo;
                          </p>
                        ) : (
                          <p className="text-stone-400 mt-0.5">{info.label}</p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-stone-400 font-mono">
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-400 text-center py-6">
              Belum ada riwayat mood yang tersimpan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
