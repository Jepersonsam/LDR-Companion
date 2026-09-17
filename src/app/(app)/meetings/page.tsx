"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarHeart,
  Plus,
  Trash2,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  Star,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { calculateCountdown, formatDate } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function MeetingsPage() {
  const { user, couple, token, isLoading } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isNextMeeting, setIsNextMeeting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const meetings = useQuery(
    api.meetings.listMeetings,
    token ? { token } : "skip"
  );

  const createMeetingMutation = useMutation(api.meetings.createMeeting);
  const setNextMeetingMutation = useMutation(api.meetings.setAsNextMeeting);
  const deleteMeetingMutation = useMutation(api.meetings.deleteMeeting);

  const [countdowns, setCountdowns] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!meetings) return;

    const updateAllCountdowns = () => {
      const newCountdowns: Record<string, any> = {};
      meetings.forEach((m) => {
        newCountdowns[m._id] = calculateCountdown(m.targetDate);
      });
      setCountdowns(newCountdowns);
    };

    updateAllCountdowns();
    const interval = setInterval(updateAllCountdowns, 1000);
    return () => clearInterval(interval);
  }, [meetings]);

  const handleOpenCreate = () => {
    setTitle("");
    setTargetDate("");
    setLocation("");
    setNotes("");
    setIsNextMeeting(meetings?.length === 0);
    setError("");
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setIsSubmitting(true);

    try {
      await createMeetingMutation({
        token,
        title,
        targetDate,
        location,
        notes: notes.trim() || undefined,
        isNextMeeting,
      });

      setIsModalOpen(false);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.4 },
        colors: ["#f43f5e", "#fb7185", "#fecdd3"],
      });
    } catch (err: any) {
      setError(err?.message || "Gagal membuat jadwal pertemuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPrimary = async (meetingId: any) => {
    if (!token) return;
    try {
      await setNextMeetingMutation({
        token,
        meetingId,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (meetingId: any) => {
    if (!token) return;
    if (confirm("Hapus jadwal pertemuan ini?")) {
      try {
        await deleteMeetingMutation({
          token,
          meetingId,
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading || !couple) {
    return <LoadingSpinner message="Menghitung mundur hari pertemuan..." />;
  }

  const upcomingMeetings = meetings?.filter((m) => !countdowns[m._id]?.isPast) ?? [];
  const pastMeetings = meetings?.filter((m) => countdowns[m._id]?.isPast) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CalendarHeart className="h-7 w-7 text-rose-500" />
            <span>Meeting Countdown</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Hitung mundur setiap detik menuju pelukan dan temu berikutnya.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="romantic"
          size="md"
          className="gap-2 shadow-rose-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Jadwal Pertemuan</span>
        </Button>
      </div>

      {/* Upcoming Meetings List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-rose-500" />
          <span>Pertemuan Mendatang ({upcomingMeetings.length})</span>
        </h2>

        {upcomingMeetings.length > 0 ? (
          <div className="space-y-4">
            {upcomingMeetings.map((m) => {
              const cd = countdowns[m._id] || { days: 0, hours: 0, minutes: 0, seconds: 0 };
              return (
                <Card
                  key={m._id}
                  variant={m.isNextMeeting ? "glow" : "glass"}
                  padding="lg"
                  className={m.isNextMeeting ? "border-rose-400" : ""}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {m.isNextMeeting && (
                          <Badge variant="rose" className="gap-1">
                            <Star className="h-3 w-3 fill-rose-500" />
                            <span>Next Primary Meeting</span>
                          </Badge>
                        )}
                        <span className="text-xs text-stone-400 font-mono">
                          {formatDate(m.targetDate)}
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-stone-900 dark:text-stone-100">
                        {m.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{m.location}</span>
                      </div>

                      {m.notes && (
                        <p className="text-xs italic text-stone-500 dark:text-stone-400 max-w-md">
                          &ldquo;{m.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Live Ticking Countdown Box */}
                    <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                      <div className="flex items-center gap-2 text-center">
                        <div className="rounded-2xl bg-white dark:bg-stone-800 p-3 shadow-md border border-rose-200/60 dark:border-rose-900/40 min-w-[64px]">
                          <span className="block text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                            {cd.days}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            Hari
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-stone-800 p-3 shadow-md border border-rose-200/60 dark:border-rose-900/40 min-w-[64px]">
                          <span className="block text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                            {cd.hours}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            Jam
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-stone-800 p-3 shadow-md border border-rose-200/60 dark:border-rose-900/40 min-w-[64px]">
                          <span className="block text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                            {cd.minutes}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            Mnt
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-stone-800 p-3 shadow-md border border-rose-200/60 dark:border-rose-900/40 min-w-[64px]">
                          <span className="block text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                            {cd.seconds}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            Dtk
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        {!m.isNextMeeting && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetPrimary(m._id)}
                            className="text-xs gap-1"
                          >
                            <Star className="h-3.5 w-3.5" />
                            <span>Jadikan Utama</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(m._id)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card variant="glass" padding="lg" className="text-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-500 mx-auto mb-3">
              <CalendarHeart className="h-7 w-7 text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Belum ada target pertemuan mendatang
            </h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Rencanakan waktu temu berikutnya untuk menyalakan semangat hari-hari LDR kalian.
            </p>
            <Button
              onClick={handleOpenCreate}
              variant="romantic"
              size="md"
              className="mt-5 gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Target Temu Baru</span>
            </Button>
          </Card>
        )}
      </div>

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-rose-100 dark:border-rose-950">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-stone-400" />
            <span>Pertemuan yang Telah Berlalu ({pastMeetings.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pastMeetings.map((m) => (
              <div
                key={m._id}
                className="p-4 rounded-2xl bg-white/40 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 text-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-stone-800 dark:text-stone-200">
                    {m.title}
                  </h4>
                  <p className="text-stone-500 dark:text-stone-400">
                    {m.location} • {formatDate(m.targetDate)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(m._id)}
                  className="p-1.5 text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Target Pertemuan Baru"
        description="Countdown akan otomatis berjalan live di dashboard kalian."
        maxWidth="md"
      >
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-3 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Nama / Judul Pertemuan"
            placeholder="contoh: Airport Reunion Bandung ❤️"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Tanggal & Jam Pertemuan"
            type="datetime-local"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
            icon={<Calendar className="h-4 w-4" />}
          />

          <Input
            label="Lokasi Pertemuan"
            placeholder="contoh: Bandara Husein Sastranegara, Bandung"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            icon={<MapPin className="h-4 w-4" />}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
              Catatan / Rencana (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="contoh: Bawa hoodie kesayangan & tiket konser bareng"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-white/70 dark:bg-stone-900/60 p-3 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isNextMeeting}
              onChange={(e) => setIsNextMeeting(e.target.checked)}
              className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-400"
            />
            <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
              Jadikan sebagai Next Meeting utama di Dashboard
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="romantic"
              size="md"
              isLoading={isSubmitting}
            >
              <span>Simpan Jadwal Pertemuan</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
