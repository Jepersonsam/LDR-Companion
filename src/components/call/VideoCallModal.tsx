"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Heart,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Avatar } from "@/components/ui/Avatar";
import { Id } from "../../../convex/_generated/dataModel";

interface VideoCallModalProps {
  token: string;
  callId: Id<"calls">;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  isCaller: boolean;
  status: "ringing" | "ongoing" | "ended" | "declined" | "missed";
  startedAt?: number;
  onEndCall: () => void;
}

export function VideoCallModal({
  token,
  callId,
  partnerName,
  partnerAvatarUrl,
  isCaller,
  status,
  startedAt,
  onEndCall,
}: VideoCallModalProps) {
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoDisabled,
    connectionState,
    hearts,
    toggleAudio,
    toggleVideo,
    sendHeart,
  } = useWebRTC({
    token,
    callId,
    isCaller,
    onEnded: onEndCall,
  });

  // Call duration counter
  useEffect(() => {
    if (status !== "ongoing") return;

    const startTime = startedAt || Date.now();
    const updateTimer = () => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, startedAt]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Floating hearts container */}
      <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
        {hearts.map((h) => (
          <div
            key={h.id}
            style={{ left: `${h.x}%` }}
            className="absolute bottom-16 text-3xl animate-floating-heart text-rose-500 filter drop-shadow-md"
          >
            ❤️
          </div>
        ))}
      </div>

      <div className="relative flex flex-col h-full w-full max-w-5xl md:h-[90vh] md:rounded-3xl overflow-hidden bg-stone-950 border border-rose-950/60 shadow-2xl">
        {/* Top Header Bar */}
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar
              name={partnerName}
              src={partnerAvatarUrl}
              size="sm"
              ring
            />
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{partnerName}</span>
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
              </h4>
              <p className="text-[11px] text-rose-200/80 font-medium">
                {status === "ringing" ? (
                  <span className="animate-pulse">Menghubungkan...</span>
                ) : (
                  <span>{formatDuration(duration)}</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Remote Video (Main Stage) */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center bg-stone-900 overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${
              !remoteStream ? "hidden" : "block"
            }`}
          />

          {/* Placeholder / Connecting state when remote video isn't ready */}
          {!remoteStream && (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-rose-500/30 animate-pulse" />
                <Avatar
                  name={partnerName}
                  src={partnerAvatarUrl}
                  size="xl"
                  ring
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {status === "ringing"
                    ? `Menghubungi ${partnerName}...`
                    : `Menyambungkan video dengan ${partnerName}...`}
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Koneksi terenkripsi langsung (Peer-to-Peer)
                </p>
              </div>
            </div>
          )}

          {/* Local Video Picture-in-Picture */}
          <div className="absolute top-20 right-4 sm:top-auto sm:bottom-28 sm:right-6 z-30 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-stone-800 backdrop-blur-md">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${
                isVideoDisabled ? "hidden" : "block"
              }`}
            />
            {isVideoDisabled && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-stone-400">
                <VideoOff className="h-6 w-6 mb-1" />
                <span className="text-[10px]">Kamera Mati</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 inset-x-0 z-30 flex items-center justify-center gap-4 p-4 sm:p-6 bg-gradient-to-t from-black/90 to-transparent">
          {/* Mute Mic */}
          <button
            onClick={toggleAudio}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all shadow-lg backdrop-blur-md ${
              isAudioMuted
                ? "bg-red-500/80 text-white hover:bg-red-500"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title={isAudioMuted ? "Nyalakan Mikrofon" : "Matikan Mikrofon"}
          >
            {isAudioMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all shadow-lg backdrop-blur-md ${
              isVideoDisabled
                ? "bg-red-500/80 text-white hover:bg-red-500"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title={isVideoDisabled ? "Nyalakan Kamera" : "Matikan Kamera"}
          >
            {isVideoDisabled ? (
              <VideoOff className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </button>

          {/* Send Heart Reaction */}
          <button
            onClick={sendHeart}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 hover:scale-110 active:scale-95 transition-all"
            title="Kirim Love Reaction"
          >
            <Heart className="h-6 w-6 fill-white animate-pulse" />
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="flex h-12 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/40 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all"
            title="Akhiri Panggilan"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
