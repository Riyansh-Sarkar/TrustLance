"use client";

import { useState } from "react";
import { X, FlaskConical } from "lucide-react";

export function TestnetBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;
  if ((process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "").toUpperCase() !== "TESTNET") return null;

  return (
    <div className="relative bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
      <div className="flex items-center justify-center gap-2 text-xs font-ui-label text-amber-700 dark:text-amber-400">
        <FlaskConical className="w-3.5 h-3.5" />
        <span>
          You are on <strong>Stellar Testnet</strong> — all funds and contracts are for testing only.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-700/60 hover:text-amber-700 dark:text-amber-400/60 dark:hover:text-amber-400 transition-colors"
        aria-label="Dismiss testnet banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
