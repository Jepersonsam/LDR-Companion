"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircleHeart,
  Smile,
  BookHeart,
  Camera,
  CalendarHeart,
  Sparkles,
  User,
  HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Avatar } from "@/components/ui/Avatar";

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Realtime Chat",
    href: "/chat",
    icon: MessageCircleHeart,
    badge: null,
  },
  {
    label: "Mood Tracker",
    href: "/mood",
    icon: Smile,
    badge: null,
  },
  {
    label: "Shared Journal",
    href: "/journal",
    icon: BookHeart,
    badge: null,
  },
  {
    label: "Memories",
    href: "/memories",
    icon: Camera,
    badge: null,
  },
  {
    label: "Meetings",
    href: "/meetings",
    icon: CalendarHeart,
    badge: null,
  },
  {
    label: "Daily Question",
    href: "/daily-question",
    icon: Sparkles,
    badge: "New",
  },
  {
    label: "Profil & Space",
    href: "/profile",
    icon: User,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, couple } = useAuth();

  const partnerName = couple?.partner?.name ?? "Partner Menunggu";

  return (
    <aside className="hidden lg:flex w-64 flex-col glass-panel border-r border-rose-200/50 dark:border-rose-950/60 p-4 h-[calc(100vh-4rem)] sticky top-16 shrink-0 justify-between">
      <div className="space-y-6">
        {/* Couple Mini Status */}
        {couple && (
          <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50/50 dark:from-rose-950/30 dark:to-stone-900 border border-rose-200/60 dark:border-rose-900/40 p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex -space-x-2">
                <Avatar
                  name={user?.name ?? "Me"}
                  src={user?.avatarUrl}
                  size="xs"
                  ring
                />
                <Avatar
                  name={couple.partner?.name ?? "?"}
                  src={couple.partner?.avatarUrl}
                  size="xs"
                  ring
                />
              </div>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                {couple.status === "active" ? "Connected ❤️" : "Pending ⏳"}
              </span>
            </div>
            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
              {user?.name} & {partnerName}
            </p>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                    : "text-stone-600 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-white"
                        : "text-rose-500 dark:text-rose-400"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                      isActive
                        ? "bg-white text-rose-600"
                        : "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Romantic Quote in Sidebar Footer */}
      <div className="rounded-xl p-3 bg-white/40 dark:bg-stone-900/40 border border-rose-100 dark:border-rose-950 text-center">
        <p className="text-[11px] italic text-rose-500/90 dark:text-rose-400">
          &ldquo;Jarak hanyalah angka saat dua hati saling menggenggam.&rdquo;
        </p>
      </div>
    </aside>
  );
}
