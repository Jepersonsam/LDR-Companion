import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateRelationshipDuration(startDateString?: string) {
  if (!startDateString) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };
  }

  const start = new Date(startDateString).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - start);

  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days: totalDays, hours, minutes, seconds, totalDays };
}

export function calculateCountdown(targetDateString?: string) {
  if (!targetDateString) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalHours: 0 };
  }

  const target = new Date(targetDateString).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalHours: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const totalHours = Math.floor(diff / (1000 * 60 * 60));

  return { days, hours, minutes, seconds, isPast: false, totalHours };
}

export function formatDate(dateString?: string | number) {
  if (!dateString) return "";
  try {
    const d = typeof dateString === "number" ? new Date(dateString) : parseISO(dateString);
    return format(d, "dd MMMM yyyy");
  } catch {
    return String(dateString);
  }
}

export function formatTime(timestamp?: number) {
  if (!timestamp) return "";
  try {
    return format(new Date(timestamp), "HH:mm");
  } catch {
    return "";
  }
}

export function formatRelativeTime(timestamp?: number) {
  if (!timestamp) return "";
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return "";
  }
}
