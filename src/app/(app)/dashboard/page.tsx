"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  CalendarHeart,
  Smile,
  BookHeart,
  Camera,
  MessageCircleHeart,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Send,
  Plus,
  Copy,
  Check,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  calculateRelationshipDuration,
  calculateCountdown,
  formatDate,
  formatRelativeTime,
} from "@/lib/utils";
import { MOODS, getMoodInfo } from "@/lib/moodConfig";
import confetti from "canvas-confetti";

export default function DashboardPage() {
  const { user, couple, token, isLoading } = useAuth();
  const [duration, setDuration] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalDays: 0,
  });
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: true,
  });
  const [copied, setCopied] = useState(false);
  const [isSendingLove, setIsSendingLove] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  // Convex Queries
  const todayMoods = useQuery(
    api.moods.getTodayCoupleMoods,
    token ? { token, date: todayStr } : "skip"
  );
  const nextMeeting = useQuery(
    api.meetings.getNextMeeting,
    token ? { token } : "skip"
  );
  const recentMessages = useQuery(
    api.messages.listMessages,
    token ? { token, limit: 3 } : "skip"
  );
  const journals = useQuery(
    api.journals.listJournals,
    token ? { token } : "skip"
  );
  const memories = useQuery(
    api.memories.listMemories,
    token ? { token } : "skip"
  );
  const todayQuestion = useQuery(
    api.dailyQuestions.getTodayQuestionAndAnswers,
    token ? { token } : "skip"
  );

  // Mutations
  const setTodayMood = useMutation(api.moods.setTodayMood);
  const sendLovePing = useMutation(api.couples.sendLovePing);

  // Live timer tick for relationship duration and meeting countdown
  useEffect(() => {
    if (!couple?.startDate) return;

    const updateTimers = () => {
      setDuration(calculateRelationshipDuration(couple.startDate));
      if (nextMeeting?.targetDate) {
        setCountdown(calculateCountdown(nextMeeting.targetDate));
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [couple?.startDate, nextMeeting?.targetDate]);

  const handleSelectMood = async (moodId: string) => {
    if (!token) return;
    try {
      await setTodayMood({
        token,
        mood: moodId,
        date: todayStr,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendHeart = async () => {
    if (!token) return;
    setIsSendingLove(true);
    try {
      await sendLovePing({
        token,
        type: "heart",
        message: "Memikirkanmu & mengirimkan pelukan hangat! ❤️",
      });
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.4 },
        colors: ["#e11d48", "#f43f5e", "#fb7185"],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSendingLove(false), 1000);
    }
  };

  const handleCopyInvite = () => {
    if (!couple?.inviteCode) return;
    navigator.clipboard.writeText(couple.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading || !couple) {
    return <LoadingSpinner message="Menyiapkan dashboard cinta kalian..." />;
  }

  const partnerName = couple.partner?.name ?? "Partner Belum Terhubung";
  const myMoodInfo = getMoodInfo(todayMoods?.myMood?.mood);
  const partnerMoodInfo = getMoodInfo(todayMoods?.partnerMood?.mood);
  const latestJournal = journals && journals.length > 0 ? journals[0] : null;

  return (
    <div className="space-y-6">
      {/* 1. Pending Partner Banner (If partner hasn't joined) */}
      {couple.status === "pending" && (
        <Card variant="glow" padding="md" className="border-rose-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white animate-pulse">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Menunggu Pasangan Bergabung
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Bagikan kode undangan ini ke pasanganmu agar space ini menjadi ruang bersama berdua.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-mono text-sm font-black bg-rose-100 dark:bg-rose-950 px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400">
                {couple.inviteCode}
              </span>
              <Button
                variant={copied ? "secondary" : "romantic"}
                size="sm"
                onClick={handleCopyInvite}
                className="gap-1.5 shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Disalin" : "Salin Kode"}</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Hero Couple & Relationship Duration Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-6 md:p-8 text-white shadow-xl shadow-rose-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          {/* Couple Avatars and Names */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center -space-x-3">
              <Avatar
                name={user?.name ?? "Me"}
                src={user?.avatarUrl}
                size="lg"
                className="border-3 border-white shadow-md"
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-500 shadow-lg z-10">
                <Heart className="h-5 w-5 fill-rose-500 animate-pulse" />
              </div>
              <Avatar
                name={partnerName}
                src={couple.partner?.avatarUrl}
                size="lg"
                className="border-3 border-white shadow-md"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-md mb-1">
                <span>{formatDate(couple.startDate)}</span>
                <span>•</span>
                <span>Sejak Hari Pertama</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                {user?.name} ❤️ {partnerName}
              </h1>
              <p className="text-xs text-rose-100 mt-0.5">
                {couple.customTitle || "Dua hati yang saling mendoakan dan merindukan."}
              </p>
            </div>
          </div>

          {/* Live Days Together Counter */}
          <div className="flex flex-col items-center md:items-end">
            <span className="text-xs uppercase tracking-wider font-semibold text-rose-100">
              Together For
            </span>
            <div className="my-1 flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-black tracking-tight font-mono">
                {duration.totalDays}
              </span>
              <span className="text-xl font-bold">Hari</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-rose-100 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
              <span>{String(duration.hours).padStart(2, "0")} jam</span>
              <span>:</span>
              <span>{String(duration.minutes).padStart(2, "0")} mnt</span>
              <span>:</span>
              <span>{String(duration.seconds).padStart(2, "0")} dtk</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Next Meeting Countdown & Mood Tracker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Meeting Countdown Card */}
          <Card variant="glass" padding="md" className="relative overflow-hidden group">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-950">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-500">
                  <CalendarHeart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    NEXT MEETING
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Target Hari Pertemuan Berikutnya
                  </p>
                </div>
              </div>

              <Link href="/meetings">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  <span>Lihat Semua</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {nextMeeting ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-stone-900 border border-rose-200/60 dark:border-rose-900/40">
                  <div>
                    <h4 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                      {nextMeeting.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-600 dark:text-stone-400">
                      <span className="flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {nextMeeting.location}
                      </span>
                      <span>•</span>
                      <span>{formatDate(nextMeeting.targetDate)}</span>
                    </div>
                  </div>

                  {/* Countdown Numbers */}
                  <div className="flex items-center gap-2 text-center">
                    <div className="rounded-xl bg-white dark:bg-stone-800 px-3 py-2 shadow-sm border border-rose-200/50 dark:border-rose-900/40">
                      <span className="block text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                        {countdown.days}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        Hari
                      </span>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-stone-800 px-3 py-2 shadow-sm border border-rose-200/50 dark:border-rose-900/40">
                      <span className="block text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                        {countdown.hours}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        Jam
                      </span>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-stone-800 px-3 py-2 shadow-sm border border-rose-200/50 dark:border-rose-900/40">
                      <span className="block text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                        {countdown.minutes}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        Mnt
                      </span>
                    </div>
                  </div>
                </div>

                {nextMeeting.notes && (
                  <p className="text-xs italic text-stone-500 dark:text-stone-400 px-1">
                    &ldquo;{nextMeeting.notes}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 p-6 text-center rounded-2xl bg-rose-50/50 dark:bg-stone-900/40 border border-dashed border-rose-200 dark:border-rose-900/40">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                  Belum ada jadwal meeting berikutnya. Buat rencana kencan untuk menghitung mundur!
                </p>
                <Link href="/meetings">
                  <Button variant="romantic" size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span>Tambah Jadwal Meeting</span>
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Today's Mood Widget */}
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-950">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-500">
                  <Smile className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    TODAY&apos;S MOOD
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Ketahui perasaan satu sama lain hari ini
                  </p>
                </div>
              </div>

              <Link href="/mood">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  <span>Riwayat Mood</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Couple Moods Comparison */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* My Mood Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  todayMoods?.myMood
                    ? `${myMoodInfo.bgColor} ${myMoodInfo.borderColor}`
                    : "bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    {user?.name} (Kamu)
                  </span>
                  <span className="text-2xl">{myMoodInfo.emoji}</span>
                </div>
                <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                  {myMoodInfo.label}
                </p>
                {todayMoods?.myMood?.note && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 italic line-clamp-1">
                    &ldquo;{todayMoods.myMood.note}&rdquo;
                  </p>
                )}
              </div>

              {/* Partner Mood Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  todayMoods?.partnerMood
                    ? `${partnerMoodInfo.bgColor} ${partnerMoodInfo.borderColor}`
                    : "bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    {partnerName}
                  </span>
                  <span className="text-2xl">{partnerMoodInfo.emoji}</span>
                </div>
                <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                  {partnerMoodInfo.label}
                </p>
                {todayMoods?.partnerMood?.note ? (
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 italic line-clamp-1">
                    &ldquo;{todayMoods.partnerMood.note}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 mt-1">
                    {todayMoods?.partnerMood
                      ? "Tidak ada catatan tambahan"
                      : "Belum update mood hari ini"}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Mood Selector Bar */}
            <div className="mt-4 pt-3 border-t border-rose-100 dark:border-rose-950">
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2">
                Pilih atau perbarui mood-mu hari ini:
              </p>
              <div className="grid grid-cols-6 gap-2">
                {MOODS.map((m) => {
                  const isSelected = todayMoods?.myMood?.mood === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMood(m.id)}
                      title={m.label}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? `${m.bgActive} scale-105 shadow-sm`
                          : "bg-white/70 dark:bg-stone-800/70 hover:scale-105 border border-rose-100 dark:border-rose-900/40"
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[10px] font-medium mt-0.5 truncate hidden sm:block">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Daily Question, Quick Chat Snippet & Memories Highlight */}
        <div className="space-y-6">
          {/* Daily Question Preview */}
          <Card variant="glow" padding="md" className="border-rose-300">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-950">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                <Sparkles className="h-4 w-4" />
                <span>Today&apos;s Daily Question</span>
              </div>
              <Badge variant="rose">Hari #{todayQuestion?.question?.dayNumber ?? 1}</Badge>
            </div>

            <div className="mt-3">
              <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100 leading-snug">
                &ldquo;{todayQuestion?.question?.questionText}&rdquo;
              </p>

              <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                <span>
                  {todayQuestion?.bothAnswered
                    ? "Keduanya sudah menjawab! ✨"
                    : todayQuestion?.hasMyAnswer
                    ? "Jawabanmu terkirim. Menunggu pasangan..."
                    : "Belum dijawab"}
                </span>
                <Link href="/daily-question">
                  <Button variant="romantic" size="sm" className="text-xs">
                    {todayQuestion?.hasMyAnswer ? "Lihat Jawaban" : "Jawab Sekarang"}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Quick Chat Snippet */}
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-950">
              <div className="flex items-center gap-2">
                <MessageCircleHeart className="h-4 w-4 text-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Pesan Terakhir
                </h3>
              </div>
              <Link href="/chat" className="text-xs font-bold text-rose-500 hover:underline">
                Buka Chat
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              {recentMessages && recentMessages.length > 0 ? (
                recentMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`p-2.5 rounded-xl text-xs ${
                      msg.isSender
                        ? "bg-rose-50 dark:bg-rose-950/40 text-stone-800 dark:text-stone-200 ml-4 border-r-2 border-rose-400"
                        : "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 mr-4 border-l-2 border-pink-400 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px] text-rose-600 dark:text-rose-400">
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="truncate">{msg.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400 text-center py-3">
                  Belum ada pesan. Sapa pasanganmu sekarang!
                </p>
              )}

              <Link href="/chat">
                <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                  <span>Kirim Pesan ke Pasangan</span>
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Memories Strip */}
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-950">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Kenangan Terkini
                </h3>
              </div>
              <Link href="/memories" className="text-xs font-bold text-rose-500 hover:underline">
                Galeri
              </Link>
            </div>

            <div className="mt-3">
              {memories && memories.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {memories.slice(0, 3).map((mem) => (
                    <div
                      key={mem._id}
                      className="aspect-square rounded-xl overflow-hidden bg-rose-100 dark:bg-stone-800 relative group"
                    >
                      {mem.imageUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={mem.imageUrl}
                          alt={mem.caption}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 text-center py-2">
                  Belum ada foto memori. Abadikan momen kalian berdua!
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
