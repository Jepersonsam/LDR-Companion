"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Calendar,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  PartyPopper,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import confetti from "canvas-confetti";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, couple, token, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCoupleMutation = useMutation(api.couples.createCouple);
  const joinCoupleMutation = useMutation(api.couples.joinCouple);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (couple && couple.status === "active") {
      router.push("/dashboard");
    } else if (couple && couple.status === "pending" && couple.inviteCode) {
      setCreatedInviteCode(couple.inviteCode);
    }
  }, [couple, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setIsSubmitting(true);

    try {
      const res = await createCoupleMutation({
        token,
        startDate,
      });
      setCreatedInviteCode(res.inviteCode);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.4 },
        colors: ["#e11d48", "#f43f5e", "#fb7185", "#fecdd3"],
      });
    } catch (err: any) {
      setError(err?.message || "Gagal membuat relationship.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setIsSubmitting(true);

    try {
      await joinCoupleMutation({
        token,
        inviteCode: inviteCodeInput,
      });

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.4 },
        colors: ["#e11d48", "#f43f5e", "#fb7185", "#ffe4e6"],
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Gagal bergabung. Periksa kode undangan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdInviteCode) return;
    navigator.clipboard.writeText(createdInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return <LoadingSpinner message="Menyiapkan akunmu..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] rounded-full bg-rose-400/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white shadow-xl shadow-rose-500/25 mb-3">
            <Heart className="h-7 w-7 fill-white animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-stone-900 dark:text-white">
            Hubungkan dengan Pasangan
          </h1>
          <p className="mt-2 text-xs md:text-sm text-stone-600 dark:text-stone-400">
            Halo, <strong className="text-rose-500">{user?.name}</strong>! Buat space baru atau gabung dengan kode undangan pasanganmu.
          </p>
        </div>

        {/* If user already created a pending relationship, show the invite code card */}
        {createdInviteCode ? (
          <Card variant="glow" padding="lg" className="border-rose-300">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-500 shadow-inner">
                <PartyPopper className="h-7 w-7 text-rose-500 animate-bounce" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Space Berhasil Dibuat! 🎉
                </h2>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                  Bagikan kode undangan ini kepada pasanganmu agar bisa bergabung ke ruang bersama.
                </p>
              </div>

              {/* Code Display */}
              <div className="rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/40 p-4">
                <p className="text-xs uppercase font-semibold text-rose-600 dark:text-rose-400 tracking-wider">
                  Kode Undangan Eksklusif
                </p>
                <p className="my-2 text-3xl font-black tracking-widest text-stone-900 dark:text-white font-mono">
                  {createdInviteCode}
                </p>
                <Button
                  onClick={handleCopyCode}
                  variant={copied ? "secondary" : "romantic"}
                  size="sm"
                  className="mt-2 w-full gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Kode Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Salin Kode Undangan</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  size="md"
                  className="w-full gap-2"
                >
                  <span>Masuk ke Dashboard Sementara</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="mt-2 text-[11px] text-stone-400">
                  Status space akan otomatis aktif begitu pasanganmu memasukkan kode di atas.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="glass" padding="lg">
            {/* Tab Selection */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-rose-100/70 dark:bg-stone-950/70 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("create");
                  setError("");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "create"
                    ? "bg-white dark:bg-stone-900 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:text-rose-500"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Buat Space Baru</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("join");
                  setError("");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "join"
                    ? "bg-white dark:bg-stone-900 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:text-rose-500"
                }`}
              >
                <KeyRound className="h-4 w-4" />
                <span>Gabung Kode Partner</span>
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-3.5 text-xs text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            {activeTab === "create" ? (
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Kapan hubungan kalian dimulai?
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Tanggal jadian / anniversary untuk menghitung durasi bersama.
                  </p>
                </div>

                <Input
                  label="Tanggal Mulai Hubungan"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  icon={<Calendar className="h-4 w-4" />}
                />

                <Button
                  type="submit"
                  variant="romantic"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full gap-2"
                >
                  <Heart className="h-4 w-4 fill-white" />
                  <span>Dapatkan Kode Undangan Pasangan</span>
                </Button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Punya kode dari pasanganmu?
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Masukkan kode 6 digit (contoh: LDR-8F29KD) yang diberikan pasangan.
                  </p>
                </div>

                <Input
                  label="Kode Undangan (Invite Code)"
                  placeholder="LDR-XXXXXX"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  required
                  icon={<KeyRound className="h-4 w-4" />}
                />

                <Button
                  type="submit"
                  variant="romantic"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full gap-2"
                >
                  <PartyPopper className="h-4 w-4" />
                  <span>Gabung ke Ruang Cinta</span>
                </Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
