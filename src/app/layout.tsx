import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { LovePingNotification } from "@/components/layout/LovePingNotification";

export const viewport: Viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "LDR Companion - Tetap dekat, meskipun berjauhan",
  description:
    "Ruang digital pribadi untuk dua orang yang sedang menjalani hubungan jarak jauh. Shared journal, memories, mood tracker, meeting countdown, video call, dan realtime chat.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LDR Companion",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
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
