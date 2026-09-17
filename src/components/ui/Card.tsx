"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "glow" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  className,
  variant = "glass",
  padding = "md",
  children,
  ...props
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-3.5",
    md: "p-5 md:p-6",
    lg: "p-6 md:p-8",
  };

  const variants = {
    glass: "glass-card rounded-2xl",
    solid:
      "bg-white dark:bg-stone-900 border border-rose-100 dark:border-rose-950 rounded-2xl shadow-sm",
    glow:
      "glass-card rounded-2xl relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-rose-500/10 before:to-pink-500/5 before:pointer-events-none border-rose-200 dark:border-rose-800/60 shadow-lg shadow-rose-500/5",
    outline:
      "border-2 border-dashed border-rose-200 dark:border-rose-900/60 rounded-2xl bg-rose-50/30 dark:bg-rose-950/10",
  };

  return (
    <div className={cn(variants[variant], paddings[padding], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-stone-500 dark:text-stone-400", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}
