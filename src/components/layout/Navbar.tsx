"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Send, Sparkles, LogOut, User, Compass } from "lucide-react";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import confetti from "canvas-confetti";

export function Navbar() {
  const { user, couple, token, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSendingLove, setIsSendingLove] = useState(false);
  const sendLovePing = useMutation(api.couples.sendLovePing);

  const handleSendHeart = async () => {
    if (!token || !couple || couple.status !== "active") return;
    setIsSendingLove(true);
    try {
      await sendLovePing({
        token,
        type: "heart",
        message: "Mengirimkan cinta tulus untukmu ❤️",
      });

      // Confetti burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.2 },
        colors: ["#e11d48", "#f43f5e", "#fb7185", "#fda4af"],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSendingLove(false), 1000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-rose-200/50 dark:border-rose-950/60 transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white shadow-md shadow-rose-500/20">
            <Heart className="h-5 w-5 fill-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-stone-900 dark:text-white text-base">
                LDR Companion
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full">
                v1.1
              </span>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 -mt-0.5">
              Tetap dekat, meskipun berjauhan
            </p>
          </div>
        </Link>

        {/* Action Buttons & Profile */}
        <div className="flex items-center gap-3">
          {couple && couple.status === "active" && (
            <Button
              variant="romantic"
              size="sm"
              onClick={handleSendHeart}
              isLoading={isSendingLove}
              className="hidden sm:inline-flex shadow-rose-500/20"
            >
              <Heart className="h-4 w-4 fill-white" />
              <span>Kirim Heart</span>
            </Button>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 rounded-full p-1 transition-all hover:ring-2 hover:ring-rose-300 focus:outline-none"
            >
              <Avatar
                name={user?.name ?? "User"}
                src={user?.avatarUrl}
                size="sm"
                ring
              />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-white dark:bg-stone-900 p-2 shadow-xl border border-rose-100 dark:border-rose-900/60 transition-all animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2.5 border-b border-rose-100 dark:border-rose-950">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {user?.name}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <div className="my-1 space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
                    >
                      <User className="h-4 w-4 text-rose-500" />
                      Profil & Pasangan
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors sm:hidden"
                    >
                      <Compass className="h-4 w-4 text-rose-500" />
                      Dashboard
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-rose-100 dark:border-rose-950">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      Keluar (Logout)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
