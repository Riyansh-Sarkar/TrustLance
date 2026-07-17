"use client";

import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { m, AnimatePresence } from 'framer-motion';
import { Loader2 } from "lucide-react";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardTopNav } from "@/components/layout/DashboardTopNav";
import { DashboardMobileNav } from "@/components/layout/DashboardMobileNav";
import { Redirect } from "@/components/Redirect";
import { TestnetBanner } from "@/components/TestnetBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isConnected, isLoading } = useWallet();

  if (!isLoading && !isConnected) {
    return <Redirect to="/auth" />;
  }

  if (isLoading || !isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-primary" />
        </m.div>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-on-surface-variant font-ui-label text-sm"
        >
          Connecting to wallet...
        </m.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-void font-body-base">
      <TestnetBanner />
      <DashboardSidebar />
      
      <main className="md:ml-[240px] min-h-screen pb-16 md:pb-0 border-l divider">
        <DashboardTopNav />
        
        <AnimatePresence mode="wait">
          <m.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pt-24 pb-12"
          >
            {children}
          </m.div>
        </AnimatePresence>
      </main>

      <DashboardMobileNav />
    </div>
  );
}

