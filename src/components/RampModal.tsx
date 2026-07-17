"use client";

import React, { useState, useCallback } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Loader2, AlertTriangle, ArrowLeftRight } from "lucide-react";
import { initiateAnchorFlow } from "@/lib/stellar/anchor";
import { STELLAR_CONFIG } from "@/constants/stellar";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

const ALLOWED_ANCHOR_HOSTS = (() => {
  try { return [new URL(STELLAR_CONFIG.anchorUrl).host]; } catch { return [] as string[]; }
})();

interface RampModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw";
  onSwapInstead?: () => void;
}

const FALLBACK_MSG =
  "The Stellar test anchor is currently unavailable. You can acquire testnet USDC from the Stellar Laboratory or use the in-app Swap feature instead.";

export function RampModal({ isOpen, onClose, type, onSwapInstead }: RampModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isConnected, publicKey } = useWallet();
  const [amount, setAmount] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = useCallback(async () => {
    if (!isConnected || !publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    setIsStarting(true);
    setError(null);
    try {
      const result = await initiateAnchorFlow({
        anchorUrl: STELLAR_CONFIG.anchorUrl,
        type,
        assetCode: STELLAR_CONFIG.usdc.code,
        publicKey,
      });
      if (!result.url) {
        throw new Error("Anchor returned an empty URL.");
      }
      const parsed = new URL(result.url);
      if (parsed.protocol !== "https:") {
        throw new Error("Anchor returned a non-HTTPS URL.");
      }
      if (ALLOWED_ANCHOR_HOSTS.length && !ALLOWED_ANCHOR_HOSTS.includes(parsed.host)) {
        throw new Error(`Anchor returned unexpected host: ${parsed.host}`);
      }
      window.open(parsed.href, "_blank", "noopener,noreferrer");
      toast.success("Complete your deposit at the anchor. Your balance will update automatically.");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to anchor";
      setError(msg);
      toast.error("Anchor unavailable. Try the Swap feature instead.");
    } finally {
      setIsStarting(false);
    }
  }, [isConnected, publicKey, type, onClose]);

  if (!isOpen) return null;

  const springTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    duration: shouldReduceMotion ? 0 : undefined,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-bg-void/90"
            onClick={onClose}
          />
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springTransition}
            className="relative w-full sm:max-w-md bg-bg-base border-2 border-edge-neutral overflow-hidden shadow-neopop"
          >
            <div className="flex justify-between items-center p-5 border-b-2 border-edge-neutral bg-bg-base">
              <h3 className="font-headline-lg text-xl font-bold text-ink-primary uppercase tracking-tight">
                {type === "deposit" ? "Deposit USDC" : "Withdraw USDC"}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="p-1.5 border-2 border-transparent hover:border-edge-neutral text-ink-secondary hover:bg-bg-void hover:text-ink-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-ink-secondary font-bold mb-6">
                {type === "deposit"
                  ? "Use your credit card or bank account to buy USDC via Stellar Anchor."
                  : "Sell your USDC and transfer funds to your bank account."}
              </p>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-xl mb-4">
                  <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-ui-label text-sm text-error">{FALLBACK_MSG}</p>
                    <a
                      href="https://laboratory.stellar.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs underline mt-1 block"
                    >
                      Stellar Laboratory
                    </a>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="ramp-amount"
                  className="block text-xs font-ui-label text-ink-secondary uppercase tracking-widest font-bold mb-2"
                >
                  Amount
                </label>
                <div className="relative">
                  <input
                    id="ramp-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-3xl font-headline-lg font-bold border-2 border-edge-neutral bg-bg-void text-ink-primary placeholder:text-ink-tertiary py-4 px-4 focus:outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    placeholder="0.00"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="font-mono-data text-on-surface-variant font-medium">USDC</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={isStarting || !isConnected}
                className="w-full neopop-button-teal py-4 mt-4 font-ui-label text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
              >
                {isStarting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connecting to Anchor...</>
                ) : (
                  type === "deposit" ? "Continue to Payment" : "Initiate Withdrawal"
                )}
              </button>

              {onSwapInstead && isConnected && (
                <button
                  type="button"
                  onClick={onSwapInstead}
                  className="w-full mt-3 py-2.5 text-on-surface-variant hover:text-on-surface font-ui-label text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Swap Instead
                </button>
              )}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
