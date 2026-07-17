"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";
import { Loader2, Droplets } from "lucide-react";

export function FriendbotButton() {
  const { publicKey, isConnected } = useWallet();
  const [isFunding, setIsFunding] = useState(false);

  const handleFund = async () => {
    if (!publicKey) return;
    setIsFunding(true);
    try {
      const res = await fetch(
        `https://friendbot.stellar.org?addr=${publicKey}`
      );
      const body = await res.text().catch(() => "");
      if (res.ok) {
        toast.success("Account funded with testnet XLM!");
        return;
      }
      if (res.status === 400 && /already\s+funded/i.test(body)) {
        toast.success("Account is already funded!");
        return;
      }
      throw new Error(`Friendbot returned ${res.status}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Funding failed";
      toast.error(msg);
    } finally {
      setIsFunding(false);
    }
  };

  if (!isConnected || !publicKey) return null;

  return (
    <button
      type="button"
      onClick={handleFund}
      disabled={isFunding}
      className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-edge-neutral bg-bg-void text-xs font-ui-label font-bold uppercase tracking-widest text-ink-primary hover:bg-bg-base hover:border-ink-secondary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
    >
      {isFunding ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Droplets className="w-3 h-3" />
      )}
      Fund via Friendbot
    </button>
  );
}
