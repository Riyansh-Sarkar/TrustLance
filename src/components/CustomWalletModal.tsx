"use client";

import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ArrowRight } from "lucide-react";
import Image from "next/image";
import type { SupportedWallet } from "@/types";

interface CustomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: SupportedWallet[];
  onSelect: (id: string) => void;
}

export function CustomWalletModal({ isOpen, onClose, wallets, onSelect }: CustomWalletModalProps) {
  const shouldReduceMotion = useReducedMotion();
  // Sort wallets: available/platform wrappers first
  const sortedWallets = wallets.toSorted((a: SupportedWallet, b: SupportedWallet) => {
    if (a.isPlatformWrapper !== b.isPlatformWrapper) return a.isPlatformWrapper ? -1 : 1;
    if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
    return 0;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-bg-void/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, duration: shouldReduceMotion ? 0 : undefined }}
            className="relative w-full max-w-md bg-bg-base border-4 border-edge-neutral overflow-hidden shadow-[12px_12px_0px_var(--color-ink-primary)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-4 border-edge-neutral bg-accent">
              <h3 className="font-headline-lg text-2xl font-black uppercase tracking-tighter text-bg-void">
                Connect Wallet
              </h3>
              <button 
                type="button"
                onClick={onClose}
                className="p-2 border-2 border-transparent hover:border-bg-void hover:bg-bg-void/10 transition-all text-bg-void active:scale-95"
              >
                <X className="w-6 h-6 stroke-[3]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 bg-bg-base space-y-6">
              <p className="font-ui-label text-ink-secondary text-sm font-bold uppercase tracking-widest border-l-4 border-accent pl-4">
                Select a Stellar wallet to continue. Mobile users select WalletConnect.
              </p>

              <div className="flex flex-col gap-4">
                {sortedWallets.length === 0 ? (
                  <div className="py-12 text-center border-4 border-dashed border-edge-neutral bg-bg-interactive">
                    <p className="font-mono-data text-ink-primary font-bold uppercase tracking-widest">No providers found</p>
                    <p className="font-ui-label text-ink-secondary text-sm font-bold mt-2">Please install a Stellar wallet</p>
                  </div>
                ) : (
                  sortedWallets.map((wallet) => (
                    <button type="button"
                      key={wallet.id}
                      disabled={!wallet.isAvailable && !wallet.isPlatformWrapper}
                      onClick={() => onSelect(wallet.id)}
                      className="group relative w-full flex items-center justify-between p-5 border-2 border-edge-neutral bg-bg-void hover:border-accent hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-accent)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:border-edge-neutral"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 shrink-0 bg-bg-interactive border-2 border-edge-neutral flex items-center justify-center p-2 group-hover:bg-bg-base transition-colors">
                          <Image 
                            src={wallet.icon} 
                            alt={wallet.name} 
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <span className="font-headline-lg text-xl font-bold uppercase text-ink-primary group-hover:text-accent tracking-tighter transition-colors">
                            {wallet.name}
                          </span>
                          {(!wallet.isAvailable && !wallet.isPlatformWrapper) && (
                            <span className="text-[10px] uppercase tracking-widest text-error font-mono-data mt-1 bg-error/10 px-2 py-0.5 border border-error/20">
                              Not Installed
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-6 h-6 stroke-[3] text-ink-tertiary group-hover:text-accent transition-all duration-300 group-hover:-rotate-45" />
                      
                      {/* Decorative corner notch */}
                      <div className="absolute top-0 right-0 w-3 h-3 border-l-2 border-b-2 border-edge-neutral bg-bg-base transition-colors group-hover:border-accent" />
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t-2 border-edge-neutral bg-bg-interactive text-center">
              <p className="text-[10px] text-ink-secondary font-mono-data font-bold uppercase tracking-widest">
                By connecting, you agree to our Terms of Service
              </p>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
