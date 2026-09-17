import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { LovePingNotification } from "@/components/layout/LovePingNotification";

export const metadata: Metadata = {
  title: "LDR Companion - Tetap dekat, meskipun berjauhan",
  description:
    "Ruang digital pribadi untuk dua orang yang sedang menjalani hubungan jarak jauh. Shared journal, memories, mood tracker, meeting countdown, dan realtime chat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col antialiased selection:bg-rose-200 selection:text-rose-900 dark:selection:bg-rose-900 dark:selection:text-rose-100">
        <ConvexClientProvider>
          {children}
          <LovePingNotification />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
