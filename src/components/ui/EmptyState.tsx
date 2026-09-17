"use client";

import React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-rose-200/80 dark:border-rose-900/40 bg-white/40 dark:bg-stone-900/40 backdrop-blur-sm",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 shadow-inner">
        {icon || <Heart className="h-7 w-7 text-rose-500 animate-pulse" />}
      </div>
      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs text-stone-500 dark:text-stone-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({
  message = "Memuat data cinta kalian...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="h-14 w-14 rounded-full border-4 border-rose-200 dark:border-rose-950 animate-ping opacity-30" />
        <div className="absolute h-10 w-10 rounded-full border-3 border-rose-500 border-t-transparent animate-spin" />
        <Heart className="absolute h-5 w-5 text-rose-500 fill-rose-500 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-stone-600 dark:text-stone-300 animate-pulse">
        {message}
      </p>
    </div>
  );
}
