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
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/chat", icon: MessageCircleHeart },
  { label: "Mood", href: "/mood", icon: Smile },
  { label: "Journal", href: "/journal", icon: BookHeart },
  { label: "Memories", href: "/memories", icon: Camera },
  { label: "Meet", href: "/meetings", icon: CalendarHeart },
  { label: "Question", href: "/daily-question", icon: Sparkles },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-panel border-t border-rose-200/60 dark:border-rose-950/80 px-2 py-1.5 backdrop-blur-lg">
      <div className="flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[48px]",
                isActive
                  ? "text-rose-500 font-bold scale-105"
                  : "text-stone-500 dark:text-stone-400 hover:text-rose-500"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  isActive && "bg-rose-100 dark:bg-rose-950/80"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
