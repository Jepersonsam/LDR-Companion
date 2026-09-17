"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, User, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const registerMutation = useMutation(api.auth.register);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await registerMutation({
        name,
        email,
        password,
      });

      if (res?.token) {
        login(res.token);
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err?.message || "Pendaftaran gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-400/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 transition-transform hover:scale-105"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white shadow-lg shadow-rose-500/25">
              <Heart className="h-6 w-6 fill-white animate-pulse" />
            </div>
            <span className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
              LDR Companion
            </span>
          </Link>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Mulai bangun ruang pribadi bersama pasangan
          </p>
        </div>

        <Card variant="glass" padding="lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-bold">Buat Akun Baru</CardTitle>
            <CardDescription>
              Hanya butuh 1 menit untuk memulai
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-3.5 text-xs text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nama Lengkap / Panggilan"
                placeholder="contoh: Samuel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                icon={<User className="h-4 w-4" />}
              />

              <Input
                label="Email"
                type="email"
                placeholder="contoh: samuel@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon={<Mail className="h-4 w-4" />}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={<Lock className="h-4 w-4" />}
              />

              <Button
                type="submit"
                variant="romantic"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2"
              >
                <span>Daftar & Lanjut</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-stone-500 dark:text-stone-400">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-bold text-rose-500 hover:text-rose-600 hover:underline"
              >
                Masuk di sini
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
