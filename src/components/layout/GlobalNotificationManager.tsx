"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { usePathname, useRouter } from "next/navigation";
import { Heart, MessageSquare, PhoneCall, Sparkles, X, Bell, BellRing } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { playMessageChime } from "@/lib/audio";
import confetti from "canvas-confetti";

export function GlobalNotificationManager() {
  const { token, couple } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  // Active in-app Toast for incoming message
  const [chatToast, setChatToast] = useState<{
    id: string;
    senderName: string;
    senderAvatarUrl?: string | null;
    content: string;
  } | null>(null);

  // Active in-app Toast for love pings
  const [loveToast, setLoveToast] = useState<{
    id: string;
    message: string;
    type: string;
  } | null>(null);

  const lastSeenMessageIdRef = useRef<string | null>(null);
  const lastSeenPingIdRef = useRef<string | null>(null);
  const isInitialMessageLoadRef = useRef(true);
  const isInitialPingLoadRef = useRef(true);
  const notifiedCallIdRef = useRef<string | null>(null);

  // Check browser notification permission status
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "default") {
        // Show banner only after user is logged in with partner
        const isDismissed = localStorage.getItem("ldr_notif_banner_dismissed");
        if (!isDismissed) {
          setShowPermissionBanner(true);
        }
      }
    }
  }, [token]);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
        setShowPermissionBanner(false);
      } catch (err) {
        console.error("Error requesting notification permission", err);
      }
    }
  };

  const dismissPermissionBanner = () => {
    setShowPermissionBanner(false);
    localStorage.setItem("ldr_notif_banner_dismissed", "true");
  };

  // 1. Subscribe to latest chat messages
  const messages = useQuery(
    api.messages.listMessages,
    token && couple ? { token, limit: 10 } : "skip"
  );

  // 2. Subscribe to active calls
  const activeCall = useQuery(
    api.calls.getActiveCall,
    token ? { token } : "skip"
  );

  // 3. Subscribe to love pings
  const pings = useQuery(
    api.couples.getRecentLovePings,
    token && couple ? { token } : "skip"
  );

  // Handle incoming Chat Notifications
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];

    if (isInitialMessageLoadRef.current) {
      lastSeenMessageIdRef.current = latestMessage._id;
      isInitialMessageLoadRef.current = false;
      return;
    }

    if (latestMessage._id !== lastSeenMessageIdRef.current) {
      lastSeenMessageIdRef.current = latestMessage._id;

      // Only notify if message is from partner
      if (!latestMessage.isSender) {
        playMessageChime();

        // If not currently on the /chat page, show In-App Toast
        if (pathname !== "/chat") {
          setChatToast({
            id: latestMessage._id,
            senderName: latestMessage.senderName,
            senderAvatarUrl: latestMessage.senderAvatarUrl,
            content: latestMessage.content,
          });

          const timer = setTimeout(() => {
            setChatToast(null);
          }, 6000);

          // Trigger System Notification if allowed
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              const notif = new Notification(`💌 Pesan dari ${latestMessage.senderName}`, {
                body: latestMessage.content,
                icon: "/icon.svg",
                badge: "/icon.svg",
                tag: "ldr-chat-" + latestMessage._id,
              });

              notif.onclick = () => {
                window.focus();
                router.push("/chat");
                notif.close();
              };
            } catch {
              // Notification fallback
            }
          }

          return () => clearTimeout(timer);
        }
      }
    }
  }, [messages, pathname, router]);

  // Handle incoming Call System Notifications
  useEffect(() => {
    if (!activeCall) return;

    if (
      activeCall.status === "ringing" &&
      !activeCall.isCaller &&
      notifiedCallIdRef.current !== activeCall._id
    ) {
      notifiedCallIdRef.current = activeCall._id;

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const callNotif = new Notification(
            `📞 Panggilan Video Masuk dari ${activeCall.callerName}!`,
            {
              body: "Klik untuk membuka dan menjawab panggilan video",
              icon: "/icon.svg",
              requireInteraction: true,
              tag: "ldr-call-" + activeCall._id,
            }
          );

          callNotif.onclick = () => {
            window.focus();
            callNotif.close();
          };
        } catch {
          // Notification fallback
        }
      }
    }
  }, [activeCall]);

  // Handle incoming Love Pings
  useEffect(() => {
    if (!pings || pings.length === 0) return;

    const latest = pings[0];
    if (isInitialPingLoadRef.current) {
      lastSeenPingIdRef.current = latest._id;
      isInitialPingLoadRef.current = false;
      return;
    }

    if (latest._id !== lastSeenPingIdRef.current) {
      lastSeenPingIdRef.current = latest._id;

      if (!latest.isSender) {
        setLoveToast({
          id: latest._id,
          message: latest.message || "Mengirimkan cinta tulus untukmu ❤️",
          type: latest.type,
        });

        playMessageChime();

        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.25, x: 0.5 },
          colors: ["#e11d48", "#f43f5e", "#fb7185", "#fda4af", "#ffe4e6"],
        });

        const timer = setTimeout(() => {
          setLoveToast(null);
        }, 6000);

        return () => clearTimeout(timer);
      }
    }
  }, [pings]);

  return (
    <>
      {/* 1. Permission Prompt Floating Banner (if permission not yet enabled) */}
      {showPermissionBanner && couple && couple.status === "active" && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="glass-card rounded-2xl p-4 border border-rose-300 dark:border-rose-800/80 shadow-2xl bg-white/95 dark:bg-stone-900/95 flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20">
              <BellRing className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Aktifkan Notifikasi Pasangan
              </h5>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Dapatkan notifikasi saat ada panggilan & pesan masuk
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={requestPermission}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Aktifkan
              </button>
              <button
                onClick={dismissPermissionBanner}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Chat Message Toast */}
      {chatToast && (
        <div
          onClick={() => {
            setChatToast(null);
            router.push("/chat");
          }}
          className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300 cursor-pointer"
        >
          <div className="glass-card rounded-2xl p-3.5 border-2 border-rose-300 dark:border-rose-800 shadow-2xl shadow-rose-500/10 bg-white/95 dark:bg-stone-900/95 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <Avatar
              name={chatToast.senderName}
              src={chatToast.senderAvatarUrl}
              size="md"
              ring
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{chatToast.senderName}</span>
              </div>
              <p className="mt-0.5 text-xs text-stone-800 dark:text-stone-200 font-medium truncate">
                {chatToast.content}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setChatToast(null);
              }}
              className="p-1 rounded-full text-stone-400 hover:bg-rose-50 dark:hover:bg-stone-800 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Floating Love Ping Toast */}
      {loveToast && (
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
                {loveToast.message}
              </p>
            </div>
            <button
              onClick={() => setLoveToast(null)}
              className="rounded-full p-1 text-stone-400 hover:bg-rose-50 dark:hover:bg-stone-800 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
