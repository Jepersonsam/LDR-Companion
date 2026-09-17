"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircleHeart,
  CalendarHeart,
  Smile,
  BookHeart,
  Camera,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && token && user) {
      if (user.hasCouple) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    }
  }, [user, token, isLoading, router]);

  return (
    <div className="flex min-h-screen flex-col justify-between relative overflow-hidden">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-400/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-rose-200/40 dark:border-rose-950/60 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white shadow-md shadow-rose-500/20">
              <Heart className="h-5 w-5 fill-white animate-pulse" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-white">
              LDR Companion
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="romantic" size="sm">
                Daftar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center max-w-5xl mx-auto">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 dark:border-rose-900/60 bg-white/70 dark:bg-stone-900/70 px-4 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 backdrop-blur-md mb-8 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-rose-500 animate-spin" />
            <span>Tagline: &quot;Tetap dekat, meskipun berjauhan.&quot;</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-stone-900 dark:text-stone-100 max-w-4xl mx-auto leading-tight md:leading-tight">
            Ruang Digital Eksklusif untuk{" "}
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
              Dua Hati
            </span>{" "}
            yang Terpisah Jarak
          </h1>

          <p className="mt-6 text-base md:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Abadikan kenangan, ketahui perasaan satu sama lain secara realtime,
            hitung mundur hari pertemuan berikutnya, dan kirimkan cinta tanpa batas.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="romantic" size="lg" className="w-full sm:w-auto px-8 gap-3 text-base shadow-xl">
                <span>Mulai Space Berdua Sekarang</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-6 text-base">
                Sudah Punya Akun? Masuk
              </Button>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:border-rose-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 mb-4 group-hover:scale-110 transition-transform">
                <CalendarHeart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Meeting Countdown
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                Hitung mundur hari, jam, dan detik menuju airport reunion atau kencan pertemuan berikutnya secara presisi.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:border-rose-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <Smile className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Realtime Mood Tracker
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                Tahu kapan pasanganmu lagi capek, butuh peluk, atau lagi bahagia dengan update mood harian realtime.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:border-rose-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-500 mb-4 group-hover:scale-110 transition-transform">
                <BookHeart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Shared Journal & Memories
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                Catatan diary bersama, galeri foto kenangan tersimpan aman, dan pertanyaan harian dengan dual-reveal.
              </p>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-14 inline-flex items-center gap-3 rounded-2xl bg-rose-50/70 dark:bg-stone-900/60 border border-rose-200/60 dark:border-rose-900/40 px-6 py-3 text-xs text-stone-600 dark:text-stone-300">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>
              100% Private — Hanya 2 orang dalam 1 relationship dengan enkripsi akses Convex.
            </span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-rose-200/40 dark:border-rose-950/60 py-6 px-6 text-center text-xs text-stone-500 dark:text-stone-400">
        <p>© 2026 LDR Companion. Dibuat dengan cinta & Convex Realtime Engine.</p>
      </footer>
    </div>
  );
}
