"use client";

import React, { useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { AlertTriangle, Loader2, X, Copy, Check, ChevronDown } from "lucide-react";
import { useAddUsdcTrustline } from "@/hooks/useAddUsdcTrustline";
import { STELLAR_CONFIG } from "@/constants/stellar";

interface TrustlineBannerProps {
  publicKey: string;
  onTrustlineAdded?: () => void;
}

export function TrustlineBanner({ onTrustlineAdded }: TrustlineBannerProps) {
  const shouldReduceMotion = useReducedMotion();
  const { addTrustline, isAdding } = useAddUsdcTrustline();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(true); // Default expanded as in the screenshot
  const [copiedField, setCopiedField] = useState<"issuer" | null>(null);

  const handleAddTrustline = async () => {
    const success = await addTrustline();
    if (success) {
      onTrustlineAdded?.();
      setIsDismissed(true);
    }
  };

  const handleCopy = async (value: string, kind: "issuer") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(kind);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      /* ignore */
    }
  };

  if (isDismissed) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="border border-edge-neutral bg-bg-void rounded-lg mb-8 overflow-hidden text-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="w-4 h-4 text-ink-secondary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-ink-primary mb-1">
              USDC trustline missing
            </p>
            <p className="text-ink-secondary text-xs">
              You need a USDC trustline to receive USDC swaps — including AMM (SAC) payouts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium self-end sm:self-auto text-ink-primary">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            aria-label="Toggle trustline details"
            className="hover:text-ink-secondary transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
          </button>
          
          <button
            type="button"
            onClick={handleAddTrustline}
            disabled={isAdding}
            className="hover:underline transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            {isAdding && <Loader2 className="w-3 h-3 animate-spin" />}
            Add USDC Trustline (SAC)
          </button>
          
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss"
            className="hover:text-ink-secondary transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="px-4 pb-4 pt-3 border-t border-edge-neutral bg-bg-void">
          <div className="grid grid-cols-[100px_1fr] gap-y-2 font-mono text-[11px] mb-4">
            <div className="text-[#c79c6e]">Asset code:</div>
            <div className="text-ink-primary font-medium">{STELLAR_CONFIG.usdc.code}</div>
            
            <div className="text-[#c79c6e]">Issuer:</div>
            <div className="flex items-center gap-2 text-ink-primary font-medium">
              <span className="break-all">{STELLAR_CONFIG.usdc.issuer}</span>
              <button
                type="button"
                aria-label="Copy issuer address"
                onClick={() => handleCopy(STELLAR_CONFIG.usdc.issuer, "issuer")}
                className="hover:text-ink-secondary transition-colors"
              >
                {copiedField === "issuer" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            
            <div className="text-[#c79c6e]">Trust limit:</div>
            <div className="text-ink-primary font-medium">1,000,000,000 USDC</div>
          </div>
          
          <div className="text-[#c79c6e] font-mono text-[11px]">
            Adding this trustline does not require any tokens - it only authorizes your account to hold USDC issued by the issuer above.
          </div>
        </div>
      )}
    </m.div>
  );
}
