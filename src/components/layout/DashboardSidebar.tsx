"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from 'framer-motion';
import { Plus, HelpCircle, UserCog, AlertTriangle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Logo } from "@/components/ui/Logo";

import { navItems } from "./navItems";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { isConnected, walletNetwork } = useWallet();
  const siteNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";
  const resolvedWalletNet = walletNetwork ? walletNetwork.toUpperCase() : siteNetwork === "PUBLIC" ? "MAINNET" : "TESTNET";
  const wNet = resolvedWalletNet === "PUBLIC" ? "MAINNET" : resolvedWalletNet;
  if (!mounted) {
    setMounted(true);
  }

  // Normalize both for comparison
  const sNetNorm = siteNetwork === "PUBLIC" ? "MAINNET" : siteNetwork.toUpperCase();
  const wNetNorm = wNet === "PUBLIC" ? "MAINNET" : wNet.toUpperCase();
  const mismatch = mounted && isConnected && walletNetwork && sNetNorm !== wNetNorm;

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] z-40 bg-bg-base border-r border-edge-neutral flex flex-col py-8 px-5 hidden md:flex">
      {/* Logo */}
      <div className="mb-8 px-2">
        <div className="mb-6">
          <Logo iconSize={26} textSize="text-lg" subTextSize="text-[8px]" />
        </div>
        
        {/* Network Badges */}
        <div className="flex flex-col gap-2 p-3 bg-bg-void rounded-xl border border-edge-neutral">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-ink-tertiary font-ui-label font-medium">Site Network</span>
            <span className={`text-[9px] font-mono-data font-medium px-2 py-0.5 rounded-md ${sNetNorm === "MAINNET" ? "bg-accent-glow text-accent border border-accent/20" : "bg-bg-interactive text-ink-secondary border border-edge-neutral"}`}>
              {sNetNorm}
            </span>
          </div>
          {mounted && isConnected && (
            <div className="flex items-center justify-between border-t border-edge-neutral pt-2 mt-1">
              <span className="text-[10px] uppercase tracking-wider text-ink-tertiary font-ui-label font-medium">Wallet Network</span>
              <span className={`text-[9px] font-mono-data font-medium px-2 py-0.5 rounded-md ${wNetNorm === "MAINNET" ? "bg-accent-glow text-accent border border-accent/20" : "bg-bg-interactive text-ink-secondary border border-edge-neutral"}`}>
                {wNetNorm}
              </span>
            </div>
          )}
          {mismatch && (
            <div className="flex items-start gap-1.5 mt-2 p-2 bg-status-disputed/5 border border-status-disputed/20 rounded-lg text-status-disputed">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="text-[9px] font-ui-label leading-normal">Network mismatch! Please switch your wallet to {sNetNorm}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-accent font-medium bg-accent-glow border-l-2 border-accent"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-bg-interactive"
              }`}
            >
              <item.icon className={`w-4 h-4 relative z-10 ${isActive ? "text-accent" : "text-ink-secondary group-hover:text-ink-primary"}`} />
              <span className="font-ui-label text-ui-label relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto pt-6 border-t border-edge-neutral space-y-1.5">
        <Link
          href="/dashboard/contracts/new"
          className="w-full neopop-button-teal font-ui-label text-ui-label font-medium py-3.5 rounded-xl mb-6 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Contract
        </Link>
        <Link
          href="/help"
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 relative ${
            pathname === "/help" 
              ? "text-accent font-medium bg-accent-glow border-l-2 border-accent" 
              : "text-ink-secondary hover:bg-bg-interactive hover:text-ink-primary"
          }`}
        >
          <HelpCircle className={`w-4 h-4 relative z-10 ${pathname === "/help" ? "text-accent" : "text-ink-secondary group-hover:text-ink-primary"}`} />
          <span className="font-ui-label text-ui-label relative z-10">Help Center</span>
        </Link>
        <Link
          href="/dashboard/account"
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 relative ${
            pathname?.startsWith("/dashboard/account") 
              ? "text-accent font-medium bg-accent-glow border-l-2 border-accent" 
              : "text-ink-secondary hover:bg-bg-interactive hover:text-ink-primary"
          }`}
        >
          <UserCog className={`w-4 h-4 relative z-10 ${pathname?.startsWith("/dashboard/account") ? "text-accent" : "text-ink-secondary group-hover:text-ink-primary"}`} />
          <span className="font-ui-label text-ui-label relative z-10">Account</span>
        </Link>
      </div>
    </aside>
  );
}
