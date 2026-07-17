/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { m } from 'framer-motion';
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User, ShieldCheck, Bell, Globe, Moon, LogOut, CheckCircle2, Edit3
} from "lucide-react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/providers/error-boundary";

const ProfileModal = dynamic(
  () => import("@/components/ProfileModal").then((mod) => mod.ProfileModal),
  { ssr: false }
);

export default function AccountPage() {
  const { publicKey, disconnectWallet } = useWallet();
  const { profile, updateProfile } = useProfile(publicKey);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const router = useRouter();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [notifications, setNotifications] = useState(true);

  // Load preferences
  useEffect(() => {
    if (typeof window !== "undefined" && publicKey) {
      const savedPrefs = localStorage.getItem(`fp_prefs_${publicKey}`);
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          if (parsed.currency) setCurrency(parsed.currency);
          if (parsed.notifications !== undefined) setNotifications(parsed.notifications);
        } catch (e) {
          console.error("Failed to parse preferences", e);
        }
      }
    }
  }, [publicKey]);

  const handleDisconnect = () => {
    disconnectWallet();
    router.push("/auth");
  };

  return (
    <ErrorBoundary>
      <div className="p-8 lg:p-12 max-w-7xl mx-auto bg-bg-void min-h-screen text-ink-primary">
        
        <div className="mb-12">
          <h1 className="font-headline-lg text-4xl lg:text-5xl font-bold tracking-tight mb-4">Settings</h1>
          <p className="text-ink-secondary font-ui-label text-lg">Manage your profile, preferences, and security settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Profile & Wallet */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* Profile Card */}
            <div className="bg-bg-base border border-edge-neutral shadow-sm p-8 rounded-[20px] relative group">
              
              <div className="w-24 h-24 rounded-full border border-edge-neutral bg-bg-void flex items-center justify-center text-ink-primary relative overflow-hidden mb-6">
                {profile?.pfpUrl ? (
                  <Image 
                    src={profile.pfpUrl} 
                    alt="Avatar" 
                    fill
                    className="object-cover" 
                    sizes="96px"
                  />
                ) : (
                  <User className="w-10 h-10 text-ink-secondary" />
                )}
                <button type="button" 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="absolute inset-0 bg-bg-void/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Edit3 className="w-6 h-6 text-accent" />
                </button>
              </div>
              
              <h2 className="font-ui-label text-2xl font-semibold text-ink-primary tracking-tight">
                {profile?.username || "Unnamed"}
              </h2>
              <div className="mt-4">
                <p className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-wider mb-1 font-medium">Connected Wallet</p>
                <p className="font-mono-data text-xs font-semibold text-ink-secondary truncate">
                  {publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-6)}` : "None"}
                </p>
              </div>
              
              <button type="button" 
                onClick={() => setIsProfileModalOpen(true)}
                className="mt-8 neopop-button-base w-full py-3 font-ui-label text-xs font-medium rounded-xl"
              >
                Edit Profile
              </button>
            </div>

            {/* Security Status */}
            <div className="bg-bg-base border border-edge-neutral shadow-sm p-6 rounded-[20px]">
              <h3 className="font-ui-label font-semibold text-xs text-ink-primary uppercase tracking-wider flex items-center gap-3 mb-6 pb-3 border-b border-edge-neutral">
                <ShieldCheck className="w-4 h-4 text-accent" />
                Security Status
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="font-mono-data text-[10px] text-ink-secondary uppercase tracking-wider font-medium">Wallet Auth</span>
                <span className="flex items-center gap-2 text-[10px] font-semibold text-accent bg-accent/5 px-2.5 py-1 rounded-md border border-accent/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SECURE
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Preferences */}
          <div className="lg:col-span-8 space-y-12">
            
            <div className="bg-bg-base border border-edge-neutral shadow-sm p-8 lg:p-12 rounded-[20px]">
              <h3 className="font-ui-label text-ink-primary font-semibold text-sm mb-8 pb-3 border-b border-edge-neutral">General Preferences</h3>
              
              <div className="space-y-8">
                {/* Currency */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex gap-6 items-center">
                    <div className="w-10 h-10 border border-edge-neutral rounded-xl flex items-center justify-center shrink-0 bg-bg-void">
                      <Globe className="w-5 h-5 text-ink-secondary" />
                    </div>
                    <div>
                      <h4 className="font-ui-label font-semibold text-ink-primary text-sm">Display Currency</h4>
                      <p className="text-[11px] font-mono-data text-ink-tertiary mt-1 uppercase tracking-wider font-medium">Preferred fiat for estimates.</p>
                    </div>
                  </div>
                  <select 
                    value={currency}
                    onChange={(e) => {
                      const newCurrency = e.target.value;
                      setCurrency(newCurrency);
                      if (typeof window !== "undefined" && publicKey) {
                        localStorage.setItem(`fp_prefs_${publicKey}`, JSON.stringify({ currency: newCurrency, notifications }));
                      }
                    }}
                    className="bg-bg-base border border-edge-neutral rounded-xl px-4 py-2.5 text-xs font-mono-data font-semibold focus:ring-2 focus:ring-accent-glow focus:border-accent outline-none transition-all cursor-pointer text-ink-primary shadow-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (&euro;)</option>
                    <option value="GBP">GBP (&pound;)</option>
                    <option value="XLM">XLM (Native)</option>
                    <option value="USDC">USDC (Stable)</option>
                  </select>
                </div>

                {/* Notifications */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex gap-6 items-center">
                    <div className="w-10 h-10 border border-edge-neutral rounded-xl flex items-center justify-center shrink-0 bg-bg-void">
                      <Bell className="w-5 h-5 text-ink-secondary" />
                    </div>
                    <div>
                      <h4 className="font-ui-label font-semibold text-ink-primary text-sm">Notifications</h4>
                      <p className="text-[11px] font-mono-data text-ink-tertiary mt-1 uppercase tracking-wider font-medium">Milestones and payments updates.</p>
                    </div>
                  </div>
                  <button type="button" 
                    aria-label="Toggle Email Notifications"
                    onClick={() => {
                      const newNotifications = !notifications;
                      setNotifications(newNotifications);
                      if (typeof window !== "undefined" && publicKey) {
                        localStorage.setItem(`fp_prefs_${publicKey}`, JSON.stringify({ currency, notifications: newNotifications }));
                      }
                    }}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors cursor-pointer border border-transparent ${notifications ? 'bg-accent' : 'bg-bg-interactive border-edge-neutral'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                {/* Theme (Read Only) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex gap-6 items-center">
                    <div className="w-10 h-10 border border-edge-neutral rounded-xl flex items-center justify-center shrink-0 bg-bg-void">
                      <Moon className="w-5 h-5 text-ink-secondary" />
                    </div>
                    <div>
                      <h4 className="font-ui-label font-semibold text-ink-primary text-sm">Dark Mode</h4>
                      <p className="text-[11px] font-mono-data text-ink-tertiary mt-1 uppercase tracking-wider font-medium">Toggle interface theme.</p>
                    </div>
                  </div>
                  <button type="button" aria-label="Toggle Dark Mode" onClick={toggleDarkMode} className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors cursor-pointer border border-transparent ${isDarkMode ? 'bg-accent' : 'bg-bg-interactive border-edge-neutral'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-status-disputed/5 border border-status-disputed/20 shadow-sm p-8 rounded-[20px]">
              <h3 className="font-ui-label text-status-disputed font-semibold text-sm mb-6 pb-3 border-b border-status-disputed/20">Danger Zone</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h4 className="font-ui-label font-semibold text-ink-primary text-sm mb-1">Disconnect Wallet</h4>
                  <p className="font-mono-data text-xs text-ink-secondary leading-relaxed">Remove current active session and wipe local data.</p>
                </div>
                <button type="button" 
                  onClick={handleDisconnect}
                  className="px-6 py-3 bg-status-disputed text-white font-ui-label font-medium rounded-xl text-xs flex items-center justify-center gap-2.5 shrink-0 hover:bg-opacity-95 cursor-pointer shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </div>

          </div>
        </div>

        <ProfileModal
          key={isProfileModalOpen ? "open" : "closed"}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          initialUsername={profile?.username || ""}
          initialPfp={profile?.pfpUrl || ""}
          onSave={(username, pfpUrl) => updateProfile({ username, pfpUrl })}
        />
      </div>
    </ErrorBoundary>
  );
}
