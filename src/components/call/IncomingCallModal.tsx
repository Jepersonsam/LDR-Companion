"use client";

import React, { useEffect } from "react";
import { Phone, PhoneOff, Video, Heart } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface IncomingCallModalProps {
  callerName: string;
  callerAvatarUrl?: string | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallModal({
  callerName,
  callerAvatarUrl,
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  // Simple gentle audio ringtone using Web Audio API
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let isMounted = true;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        const playChime = () => {
          if (!isMounted || !ctx || ctx.state === "closed") return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        };

        const interval = setInterval(playChime, 2000);
        playChime();

        return () => {
          isMounted = false;
          clearInterval(interval);
          if (ctx && ctx.state !== "closed") {
            ctx.close().catch(() => {});
          }
        };
      }
    } catch {
      // Audio autoplay policy fallback
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm rounded-3xl bg-white/90 dark:bg-stone-900/90 p-6 text-center shadow-2xl border border-rose-200/80 dark:border-rose-900/60 backdrop-blur-xl">
        {/* Animated pulse rings */}
        <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-rose-500/30 animate-pulse" />
          <div className="relative z-10">
            <Avatar
              name={callerName}
              src={callerAvatarUrl}
              size="xl"
              ring
            />
          </div>
          <div className="absolute -top-1 -right-1 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg">
            <Heart className="h-4 w-4 fill-white animate-bounce" />
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">
          {callerName}
        </h3>
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center justify-center gap-1.5">
          <Video className="h-3.5 w-3.5 animate-pulse" />
          <span>Panggilan Video Masuk...</span>
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={onDecline}
            className="flex flex-col items-center gap-2 group focus:outline-none"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-transform group-hover:scale-110 group-active:scale-95">
              <PhoneOff className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              Tolak
            </span>
          </button>

          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-2 group focus:outline-none"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-110 group-active:scale-95 animate-bounce">
              <Phone className="h-6 w-6 fill-white" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Terima
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
