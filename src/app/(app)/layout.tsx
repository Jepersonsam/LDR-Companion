"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, couple, token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!token) {
        router.push("/login");
      } else if (user && !user.hasCouple) {
        router.push("/onboarding");
      }
    }
  }, [token, user, isLoading, router, pathname]);

  if (isLoading || !token) {
    return <LoadingSpinner message="Menghubungkan ke ruang cinta..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/50 dark:bg-[#120a0f]">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
