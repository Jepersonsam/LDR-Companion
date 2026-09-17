"use client";

import React from "react";
import { Heart } from "lucide-react";

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
