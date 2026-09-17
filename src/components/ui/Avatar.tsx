"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
}

export function Avatar({
  src,
  name = "User",
  size = "md",
  className,
  ring = false,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold shadow-inner",
        sizes[size],
        ring && "ring-2 ring-rose-400 ring-offset-2 ring-offset-background",
        src && !imageError
          ? "bg-rose-100 dark:bg-rose-950"
          : "bg-gradient-to-tr from-rose-500 to-pink-400 text-white",
        className
      )}
    >
      {src && !imageError ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
