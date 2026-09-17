export interface MoodOption {
  id: "happy" | "loved" | "okay" | "sad" | "tired" | "angry";
  emoji: string;
  label: string;
  description: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  bgActive: string;
}

export const MOODS: MoodOption[] = [
  {
    id: "happy",
    emoji: "😊",
    label: "Happy",
    description: "Merasa senang & bersemangat",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800/50",
    bgActive: "bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-400",
  },
  {
    id: "loved",
    emoji: "🥰",
    label: "Loved",
    description: "Penuh cinta & rindu",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    textColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-200 dark:border-rose-800/50",
    bgActive: "bg-rose-100 dark:bg-rose-900/50 ring-2 ring-rose-400",
  },
  {
    id: "okay",
    emoji: "😐",
    label: "Okay",
    description: "Biasa saja & tenang",
    bgColor: "bg-slate-50 dark:bg-slate-900/40",
    textColor: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-200 dark:border-slate-800",
    bgActive: "bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400",
  },
  {
    id: "sad",
    emoji: "😔",
    label: "Sad",
    description: "Kurang bersemangat / sedih",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800/50",
    bgActive: "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-400",
  },
  {
    id: "tired",
    emoji: "😴",
    label: "Tired",
    description: "Lelah butuh istirahat / peluk",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800/50",
    bgActive: "bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-400",
  },
  {
    id: "angry",
    emoji: "😡",
    label: "Angry",
    description: "Lagi kesal / bad mood",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800/50",
    bgActive: "bg-red-100 dark:bg-red-900/50 ring-2 ring-red-400",
  },
];

export function getMoodInfo(moodId?: string) {
  return MOODS.find((m) => m.id === moodId) ?? {
    id: "okay" as const,
    emoji: "✨",
    label: "Unknown",
    description: "Belum memilih mood",
    bgColor: "bg-zinc-50 dark:bg-zinc-900/40",
    textColor: "text-zinc-500",
    borderColor: "border-zinc-200 dark:border-zinc-800",
    bgActive: "bg-zinc-100 dark:bg-zinc-800",
  };
}
