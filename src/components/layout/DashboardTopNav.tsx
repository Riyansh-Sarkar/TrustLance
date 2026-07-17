"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from 'framer-motion';
import { Bell, Search, Sun, Moon, User, ChevronDown, Settings, LogOut, AlertTriangle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Logo } from "@/components/ui/Logo";
import { FriendbotButton } from "@/components/FriendbotButton";
import dynamic from "next/dynamic";

const ProfileModal = dynamic(
  () => import("@/components/ProfileModal").then((mod) => mod.ProfileModal),
  { ssr: false }
);

export function DashboardTopNav() {
  const router = useRouter();
  const { publicKey, disconnectWallet, isConnected, walletNetwork } = useWallet();
  const { profile, updateProfile } = useProfile(publicKey);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  const siteNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";
  const configuredSiteNetwork = siteNetwork === "PUBLIC" ? "MAINNET" : siteNetwork.toUpperCase();
  const resolvedWalletNet = walletNetwork ? walletNetwork.toUpperCase() : configuredSiteNetwork;
  const wNet = resolvedWalletNet === "PUBLIC" ? "MAINNET" : resolvedWalletNet;
  
  // Normalize both for comparison
  const sNetNorm = configuredSiteNetwork;
  const wNetNorm = wNet === "PUBLIC" ? "MAINNET" : wNet.toUpperCase();
  const mismatch = isConnected && walletNetwork && sNetNorm !== wNetNorm;

  const commandLinks = React.useMemo(() => {
    const all = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Contracts", href: "/dashboard/contracts" },
      { label: "Payments", href: "/dashboard/payments" },
      { label: "Transactions", href: "/dashboard/transactions" },
      { label: "Analytics", href: "/dashboard/analytics" },
      { label: "Account", href: "/dashboard/account" },
      { label: "Help", href: "/dashboard/help" },
    ];
    if (!commandSearch) return all;
    const term = commandSearch.toLowerCase();
    return all.filter(l => l.label.toLowerCase().includes(term));
  }, [commandSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (commandRef.current && !commandRef.current.contains(e.target as Node)) {
        setIsCommandOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 md:left-[240px] right-0 z-30 h-16 bg-bg-void/90 backdrop-blur-md divider border-b flex justify-between items-center px-4 md:px-margin-desktop">
        {/* Mobile Logo & Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="md:hidden flex items-center gap-2 mr-2">
            <Logo iconSize={28} textSize="text-lg" subTextSize="text-[8px]" hideTextOnMobile={true} />
          </div>
          {mismatch && (
            <div className="md:hidden flex items-center gap-1.5 px-2 py-1 bg-status-disputed/10 border border-status-disputed/20 rounded text-status-disputed text-[10px] font-ui-label">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Mismatch: Use {sNetNorm}</span>
            </div>
          )}
          <div className="hidden md:block">
            <FriendbotButton />
          </div>
          <div className="relative w-full max-w-md hidden sm:block" ref={commandRef}>
            <Search className="absolute left-4 top-[10px] text-ink-tertiary w-4 h-4" />
            <input
              aria-label="Search"
              className="w-full bg-bg-base border border-edge-neutral rounded-xl pl-12 pr-4 py-2 font-ui-label text-ui-label text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-glow focus:border-accent transition-all placeholder:text-ink-tertiary"
              placeholder="Search contracts, transactions..."
              type="text"
              value={commandSearch}
              onChange={(e) => { setCommandSearch(e.target.value); setIsCommandOpen(true); }}
              onFocus={() => setIsCommandOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsCommandOpen(false);
                if (e.key === "Enter" && commandLinks.length > 0) {
                  router.push(commandLinks[0].href);
                  setIsCommandOpen(false);
                }
              }}
            />
            <AnimatePresence>
              {isCommandOpen && commandLinks.length > 0 && (
                <m.div
                  initial={{ opacity: 0, scale: 0.98, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full mt-2 w-full bg-bg-raised border border-edge-neutral rounded-2xl shadow-xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-edge-neutral bg-bg-base">
                    <p className="font-ui-label text-sm font-semibold text-ink-primary">Quick Links</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    {commandLinks.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => { router.push(item.href); setIsCommandOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-primary hover:bg-bg-interactive transition-colors text-left"
                      >
                        <Search className="w-4 h-4 text-ink-secondary shrink-0" />
                        <span className="font-ui-label">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div ref={notifDropdownRef} className="relative">
            <button type="button" 
              onClick={() => setIsNotificationsOpen((v) => !v)}
              aria-label="Notifications" 
              className={`p-2 transition-all rounded-full relative group ${isNotificationsOpen ? 'bg-bg-interactive text-ink-primary' : 'text-ink-secondary hover:bg-bg-interactive hover:text-ink-primary'}`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-disputed rounded-full border-2 border-bg-void" />
            </button>
            <AnimatePresence>
              {isNotificationsOpen && (
                <m.div
                  initial={{ opacity: 0, scale: 0.98, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-2 w-80 bg-bg-raised border border-edge-neutral rounded-2xl shadow-xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-edge-neutral bg-bg-base flex items-center justify-between">
                    <p className="font-ui-label text-sm font-semibold text-ink-primary">
                      Notifications
                    </p>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <div className="p-6 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-bg-interactive flex items-center justify-center">
                      <Bell className="w-5 h-5 text-ink-tertiary opacity-50" />
                    </div>
                    <div>
                      <p className="font-ui-label text-sm text-ink-primary font-semibold mb-1">You&apos;re all caught up!</p>
                      <p className="font-ui-label text-xs text-ink-secondary leading-relaxed">We&apos;ll notify you here when contract milestones are updated or funded.</p>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
          <button type="button" 
            aria-label="Toggle dark mode"
            onClick={toggleDarkMode}
            className="p-2 text-ink-secondary hover:bg-bg-interactive hover:text-ink-primary transition-all rounded-full flex items-center justify-center w-9 h-9"
          >
            {isDarkMode ? (
              <Moon className="w-5 h-5 text-accent" />
            ) : (
              <Sun className="w-5 h-5 text-[#F59E0B]" />
            )}
          </button>

          <div className="h-8 w-[1px] bg-edge-neutral mx-1" />

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="relative">
            <button type="button"
              onClick={() => setIsProfileDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-bg-interactive transition-all border border-transparent hover:border-edge-neutral focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent overflow-hidden border border-edge-neutral shrink-0 relative">
                {profile?.pfpUrl ? (
                  <Image 
                    src={profile.pfpUrl} 
                    alt="PFP" 
                    fill
                    className="object-cover" 
                    sizes="28px"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                {mismatch && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-status-disputed rounded-full border border-bg-void" />
                )}
              </div>
              <span className="font-ui-label text-sm text-ink-primary font-semibold hidden lg:block">
                {profile?.username
                  ? profile.username
                  : publicKey ? `${publicKey.slice(0, 4)}&hellip;${publicKey.slice(-4)}` : "Connected"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-ink-secondary hidden lg:block transition-transform duration-200 ${
                  isProfileDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {isProfileDropdownOpen && (
                <m.div
                  initial={{ opacity: 0, scale: 0.98, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-2 w-64 bg-bg-raised border border-edge-neutral rounded-2xl shadow-xl overflow-hidden z-50"
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-edge-neutral bg-bg-base">
                    <p className="font-ui-label text-sm font-semibold text-ink-primary truncate">
                      {profile?.username || "Wallet Connected"}
                    </p>
                    <p className="font-mono-data text-[10px] text-ink-tertiary mt-0.5 truncate">
                      {publicKey ? `${publicKey.slice(0, 8)}&hellip;${publicKey.slice(-6)}` : ""}
                    </p>
                  </div>

                  {/* Network Details in Dropdown */}
                  <div className="px-4 py-3 border-b border-edge-neutral bg-bg-void">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-ink-tertiary font-ui-label font-medium">Site Network</span>
                      <span className={`text-[9px] font-mono-data font-medium px-2 py-0.5 rounded-md border ${sNetNorm === "MAINNET" ? "bg-accent/10 text-accent border-accent/20" : "bg-bg-interactive text-ink-secondary border-edge-neutral"}`}>
                        {sNetNorm}
                      </span>
                    </div>
                    {isConnected && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-ink-tertiary font-ui-label font-medium">Wallet Network</span>
                        <span className={`text-[9px] font-mono-data font-medium px-2 py-0.5 rounded-md border ${wNetNorm === "MAINNET" ? "bg-accent/10 text-accent border-accent/20" : "bg-bg-interactive text-ink-secondary border-edge-neutral"}`}>
                          {wNetNorm}
                        </span>
                      </div>
                    )}
                    {mismatch && (
                      <div className="flex items-start gap-1.5 mt-2.5 p-2 bg-status-disputed/5 border border-status-disputed/20 rounded-xl text-status-disputed">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <p className="text-[9px] font-ui-label leading-normal">Network mismatch! Please switch your wallet to {sNetNorm}.</p>
                      </div>
                    )}
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-0.5">
                    <button type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-primary hover:bg-bg-interactive transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-ink-secondary shrink-0" />
                      <span className="font-ui-label">Edit Profile</span>
                    </button>
                    <button type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        router.push("/dashboard/account");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-primary hover:bg-bg-interactive transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-ink-secondary shrink-0" />
                      <span className="font-ui-label">Settings</span>
                    </button>
                  </div>

                  {/* Disconnect */}
                  <div className="p-1.5 border-t border-edge-neutral">
                    <button type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        disconnectWallet();
                        router.push("/auth");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-status-disputed hover:bg-status-disputed/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span className="font-ui-label font-medium">Disconnect Wallet</span>
                    </button>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <ProfileModal
        key={isProfileModalOpen ? "open" : "closed"}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialUsername={profile?.username || ""}
        initialPfp={profile?.pfpUrl || ""}
        onSave={(username, pfpUrl) => updateProfile({ username, pfpUrl })}
      />
    </>
  );
}
