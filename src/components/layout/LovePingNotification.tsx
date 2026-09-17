"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Heart, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";

export function LovePingNotification() {
  const { token, couple } = useAuth();
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    message?: string;
    type: string;
  } | null>(null);

  const lastSeenPingIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  const pings = useQuery(
    api.couples.getRecentLovePings,
    token ? { token } : "skip"
  );

  useEffect(() => {
    if (!pings || pings.length === 0) return;

    const latest = pings[0];
    if (isInitialLoadRef.current) {
      lastSeenPingIdRef.current = latest._id;
      isInitialLoadRef.current = false;
      return;
    }

    if (latest._id !== lastSeenPingIdRef.current) {
      lastSeenPingIdRef.current = latest._id;

      // Only notify if it was sent by partner
      if (!latest.isSender) {
        setActiveAlert({
          id: latest._id,
          message: latest.message || "Mengirimkan cinta tulus untukmu ❤️",
          type: latest.type,
        });

        // Trigger celebratory confetti
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.3, x: 0.5 },
          colors: ["#e11d48", "#f43f5e", "#fb7185", "#fda4af", "#ffe4e6"],
        });

        // Auto dismiss after 6 seconds
        const timer = setTimeout(() => {
          setActiveAlert(null);
        }, 6000);

        return () => clearTimeout(timer);
      }
    }
  }, [pings]);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="glass-card rounded-2xl p-4 border-2 border-rose-400 dark:border-rose-500 shadow-2xl shadow-rose-500/20 bg-white/95 dark:bg-stone-900/95 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-bounce">
          <Heart className="h-5 w-5 fill-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Love Ping dari {couple?.partner?.name ?? "Pasangan"}!</span>
          </div>
          <p className="mt-1 text-sm font-medium text-stone-800 dark:text-stone-100">
            {activeAlert.message}
          </p>
        </div>
        <button
          onClick={() => setActiveAlert(null)}
          className="rounded-full p-1 text-stone-400 hover:bg-rose-50 dark:hover:bg-stone-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
