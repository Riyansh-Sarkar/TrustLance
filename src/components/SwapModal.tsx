"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ArrowUpDown, Loader2, AlertTriangle, Copy, Check } from "lucide-react";
import { Asset } from "@stellar/stellar-sdk";
import { useWallet } from "@/hooks/useWallet";
import { useCountUp } from "@/hooks/useCountUp";
import { getSwapQuote, buildSwapTransaction, hasTrustline } from "@/lib/stellar/swap";
import { getAccountBalance } from "@/lib/stellar/client";
import { useAddUsdcTrustline } from "@/hooks/useAddUsdcTrustline";
import { submitHorizonTransaction, submitSignedTransaction } from "@/lib/stellar/utils";
import { buildSorobanSwapTx } from "@/lib/stellar/sorobanSwap";
import { useLiquidityPoolInfo } from "@/hooks/useLiquidityPoolInfo";
import { STELLAR_CONFIG, getUsdcAsset } from "@/constants/stellar";
import { recordSwapEvent } from "@/lib/firebase/swapEvents";
import { getTxExplorerUrl, shortenTxHash } from "@/lib/stellar/explorer";
import { toast } from "sonner";

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDirection?: "buy_usdc" | "sell_usdc";
  onSwapComplete?: (summary: {
    direction: "buy_usdc" | "sell_usdc";
    sourceAsset: "XLM" | "USDC";
    destAsset: "XLM" | "USDC";
    sourceAmount: string;
    destinationAmount: string;
    txHash?: string;
  }) => void;
}

const SLIPPAGE_OPTIONS = [
  { label: "0.5%", value: 0.005 },
  { label: "1%", value: 0.01 },
  { label: "2%", value: 0.02 },
] as const;

type SwapDirection = "buy_usdc" | "sell_usdc";

type SwapStep = "input" | "review" | "signing" | "done";

export function SwapModal({ isOpen, onClose, defaultDirection = "buy_usdc", onSwapComplete }: SwapModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isConnected, publicKey, sign } = useWallet();
  const { pool: ammPool } = useLiquidityPoolInfo();
  const [direction, setDirection] = useState<SwapDirection>(defaultDirection);
  const [prevDefaultDirection, setPrevDefaultDirection] = useState(defaultDirection);
  if (prevDefaultDirection !== defaultDirection) {
    setPrevDefaultDirection(defaultDirection);
    setDirection(defaultDirection);
  }
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(0.01);
  const [step, setStep] = useState<SwapStep>("input");
  const [isFlipped, setIsFlipped] = useState(false);

  const [xlmBalance, setXlmBalance] = useState("0");
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [hasUSDCTrust, setHasUSDCTrust] = useState(false);
  const [copiedIssuer, setCopiedIssuer] = useState(false);
  const [forceHorizon, setForceHorizon] = useState(false);

  const [quote, setQuote] = useState<{
    kind: "send" | "receive";
    sourceAmount: string;
    destinationAmount: string;
    path: Asset[];
    source?: "horizon" | "reference_rate";
    xlmUsdRate?: number;
    warning?: string;
  } | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const { addTrustline, isAdding: isAddingTrustline } = useAddUsdcTrustline();

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setStep("input");
      setAmount("");
      setQuote(null);
      setIsSigning(false);
      setLastTxHash(null);
    }
  }

  const fromAsset = useMemo(
    () => (direction === "buy_usdc" ? Asset.native() : getUsdcAsset()),
    [direction]
  );
  const toAsset = useMemo(
    () => (direction === "buy_usdc" ? getUsdcAsset() : Asset.native()),
    [direction]
  );
  const fromLabel = direction === "buy_usdc" ? "XLM" : "USDC";
  const toLabel = direction === "buy_usdc" ? "USDC" : "XLM";
  const fromBalance = direction === "buy_usdc" ? xlmBalance : usdcBalance;
  const toBalance = direction === "buy_usdc" ? usdcBalance : xlmBalance;

  const animatedFromBalance = useCountUp(Number(fromBalance) || 0, 600);
  const animatedToBalance = useCountUp(Number(toBalance) || 0, 600);

  useEffect(() => {
    if (isOpen && isConnected && publicKey) {
      Promise.all([
        getAccountBalance(publicKey, "XLM"),
        getAccountBalance(publicKey, "USDC"),
        hasTrustline({
          publicKey,
          assetCode: STELLAR_CONFIG.usdc.code,
          assetIssuer: STELLAR_CONFIG.usdc.issuer,
        }, false),
      ]).then(([xlmResult, usdcResult, trustResult]) => {
        setXlmBalance(xlmResult.balance);
        setUsdcBalance(usdcResult.balance);
        setHasUSDCTrust(trustResult);
      });
    }
  }, [isOpen, isConnected, publicKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForceHorizon(false);
  }, [amount, direction]);

  useEffect(() => {
    if (!amount || Number(amount) <= 0 || !isConnected || !publicKey) {
      const timeout = setTimeout(() => setQuote(null), 0);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(async () => {
      setIsQuoteLoading(true);
      try {
        const q = await getSwapQuote({
          sourceAsset: fromAsset,
          destAsset: toAsset,
          sourceAmount: amount,
          destAmount: amount,
          publicKey,
          kind: "send",
          forceHorizon,
        });
        setQuote(q);
      } catch {
        setQuote(null);
      } finally {
        setIsQuoteLoading(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [amount, direction, isConnected, publicKey, fromAsset, toAsset, forceHorizon]);

  const handleFlip = useCallback(() => {
    setDirection((d) => (d === "buy_usdc" ? "sell_usdc" : "buy_usdc"));
    setIsFlipped((f) => !f);
    setAmount("");
    setQuote(null);
    setStep("input");
  }, []);

  const destMin = useMemo(() => {
    if (!quote) return "0";
    const dest = Number(quote.destinationAmount);
    return (dest * (1 - slippage)).toFixed(7);
  }, [quote, slippage]);

  const ammInsufficientLiquidity = useMemo(() => {
    if (quote?.source !== "reference_rate" || !ammPool?.isInitialized) return false;
    const amountIn = Number(amount);
    if (!amountIn || amountIn <= 0) return false;

    // A = XLM, B = USDC based on the UI convention
    const reserveIn = direction === "buy_usdc" ? ammPool.reserveA : ammPool.reserveB;
    const reserveOut = direction === "buy_usdc" ? ammPool.reserveB : ammPool.reserveA;

    if (reserveIn === 0 || reserveOut === 0) return true;

    // Constant product formula: out = (reserveOut * in) / (reserveIn + in)
    // We add a tiny 0.3% fee deduction typical for AMMs: in_after_fee = in * 0.997
    const amountInWithFee = amountIn * 0.997;
    const ammOutput = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

    return ammOutput < Number(destMin);
  }, [quote, ammPool, amount, direction, destMin]);

  const priceDisplay = useMemo(() => {
    if (!quote) return null;
    const src = Number(quote.sourceAmount);
    const dst = Number(quote.destinationAmount);
    if (dst === 0) return null;
    const rate = src / dst;
    return `1 ${toLabel} \u2248 ${rate.toFixed(4)} ${fromLabel}`;
  }, [quote, fromLabel, toLabel]);

  const referenceRateDisplay = useMemo(() => {
    if (!quote || quote.source !== "reference_rate") return null;
    const rate = quote.xlmUsdRate ?? 0;
    if (rate <= 0) return null;
    if (direction === "buy_usdc") {
      return `1 XLM ≈ $${rate.toFixed(4)} · 1 USDC ≈ $1.00`;
    }
    return `1 XLM ≈ $${rate.toFixed(4)} · 1 USDC ≈ $1.00`;
  }, [quote, direction]);

  const handleReview = useCallback(() => {
    if (!quote || !amount) return;
    setStep("review");
  }, [quote, amount]);

  const onSwapCompleteRef = useRef<SwapModalProps["onSwapComplete"]>(onSwapComplete);
  useEffect(() => {
    onSwapCompleteRef.current = onSwapComplete;
  }, [onSwapComplete]);

  const handleSignAndSwap = useCallback(async () => {
    if (!isConnected || !publicKey || !quote) return;
    setIsSigning(true);
    setStep("signing");
    const toastId = toast.loading("Building swap transaction...");
    const eventDirection: "buy_usdc" | "sell_usdc" = direction;
    const sourceAssetLabel: "XLM" | "USDC" =
      direction === "buy_usdc" ? "XLM" : "USDC";
    const destAssetLabel: "XLM" | "USDC" =
      direction === "buy_usdc" ? "USDC" : "XLM";
    try {
      let xdr: string;
      const useSorobanAmm =
        quote.source === "reference_rate" && STELLAR_CONFIG.ammContractId;

      if (useSorobanAmm) {
        toast.loading("Building Soroban AMM swap...", { id: toastId });
        xdr = await buildSorobanSwapTx({
          publicKey,
          sendAsset: fromAsset,
          sendAmount: quote.sourceAmount,
          minDestAmount: destMin,
        });
      } else {
        toast.loading("Building swap transaction...", { id: toastId });
        xdr = await buildSwapTransaction({
          kind: quote.kind,
          sourceAsset: fromAsset,
          sourceAmount: quote.sourceAmount,
          destAsset: toAsset,
          destAmount: quote.destinationAmount,
          destMin,
          publicKey,
          path: quote.path,
        });
      }
      toast.loading("Waiting for wallet signature...", { id: toastId });
      const signedXdr = await sign(xdr);
      toast.loading("Submitting swap to network...", { id: toastId });

      let txHash: string | undefined;
      if (useSorobanAmm) {
        const sorobanResult = await submitSignedTransaction(signedXdr);
        txHash = sorobanResult && "hash" in sorobanResult
          ? String((sorobanResult as { hash: string }).hash)
          : undefined;
      } else {
        const horizonResult = await submitHorizonTransaction(signedXdr);
        txHash = horizonResult && typeof horizonResult === "object" && "hash" in horizonResult
          ? String((horizonResult as { hash: string }).hash)
          : undefined;
      }
      setLastTxHash(txHash ?? null);
      toast.success(
        txHash
          ? `Swap completed · tx ${shortenTxHash(txHash)}`
          : "Swap completed successfully!",
        {
          id: toastId,
          duration: 5000,
          description: txHash ? (
            <a
              href={getTxExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover underline text-xs"
            >
              View on Stellar Expert ↗
            </a>
          ) : undefined,
        }
      );
      setStep("done");
      if (isConnected && publicKey) {
        getAccountBalance(publicKey, "XLM").then((r) => setXlmBalance(r.balance));
        getAccountBalance(publicKey, "USDC").then((r) => setUsdcBalance(r.balance));
      }
      await recordSwapEvent({
        walletAddress: publicKey,
        direction: eventDirection,
        sourceAsset: sourceAssetLabel,
        destAsset: destAssetLabel,
        sourceAmount: quote.sourceAmount,
        destinationAmount: quote.destinationAmount,
        txHash,
        status: "completed",
      }).catch((e) => console.warn("Failed to record swap event:", e));
      onSwapCompleteRef.current?.({
        direction: eventDirection,
        sourceAsset: sourceAssetLabel,
        destAsset: destAssetLabel,
        sourceAmount: quote.sourceAmount,
        destinationAmount: quote.destinationAmount,
        txHash,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Swap failed";
      const errResult = (err as { response?: { data?: { hash?: string } } } | null)
        ?.response?.data;
      const failureHash = errResult?.hash;
      if (failureHash) setLastTxHash(failureHash);
      toast.error(`Swap Failed: ${msg}`, {
        id: toastId,
        duration: 6000,
        description: failureHash ? (
          <a
            href={getTxExplorerUrl(failureHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-error hover:text-error-hover underline text-xs"
          >
            View failed tx on Stellar Expert ↗
          </a>
        ) : undefined,
      });
      setStep("input");
      if (publicKey && quote) {
        recordSwapEvent({
          walletAddress: publicKey,
          direction: eventDirection,
          sourceAsset: sourceAssetLabel,
          destAsset: destAssetLabel,
          sourceAmount: quote.sourceAmount,
          destinationAmount: quote.destinationAmount,
          status: "failed",
          errorMessage: msg,
        }).catch(() => {});
      }
    } finally {
      setIsSigning(false);
    }
  }, [isConnected, publicKey, quote, fromAsset, toAsset, destMin, sign, direction]);

  const handleCopy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIssuer(true);
      setTimeout(() => setCopiedIssuer(false), 1500);
    } catch {
      toast.error("Clipboard unavailable");
    }
  }, []);

  const handleAddTrustline = useCallback(async () => {
    const success = await addTrustline();
    if (success && isConnected && publicKey) {
      setHasUSDCTrust(true);
      getAccountBalance(publicKey, "USDC").then((r) => setUsdcBalance(r.balance));
    }
  }, [addTrustline, isConnected, publicKey]);

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
            className="relative w-full sm:max-w-md bg-bg-base border-2 border-edge-neutral shadow-neopop max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b-2 border-edge-neutral bg-bg-base">
              <h3 className="font-headline-lg text-xl font-bold uppercase tracking-tight text-ink-primary">Swap</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="p-1.5 text-ink-secondary hover:bg-edge-neutral/10 hover:text-ink-primary transition-colors border-2 border-transparent hover:border-edge-neutral"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!hasUSDCTrust && direction === "buy_usdc" && (
                <m.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-xl"
                >
                  <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-ui-label text-sm text-error font-semibold">USDC Trustline Required</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      You need a USDC trustline to receive USDC. Add one now.
                    </p>
                    <div className="mt-2 space-y-1.5 font-mono-data text-[11px] text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="font-ui-label font-semibold text-on-surface">Asset:</span>
                        <span>{STELLAR_CONFIG.usdc.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-ui-label font-semibold text-on-surface">Issuer:</span>
                        <span className="break-all">{STELLAR_CONFIG.usdc.issuer}</span>
                        <button
                          type="button"
                          aria-label="Copy issuer address"
                          onClick={() => handleCopy(STELLAR_CONFIG.usdc.issuer)}
                          className="text-primary hover:text-primary-hover"
                        >
                          {copiedIssuer ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-ui-label font-semibold text-on-surface">Limit:</span>
                        <span>1,000,000,000 USDC</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTrustline}
                      disabled={isAddingTrustline}
                      className="mt-3 px-4 py-1.5 bg-error text-on-error rounded-lg font-ui-label text-xs font-bold hover:bg-error-hover transition-colors disabled:opacity-50"
                    >
                      {isAddingTrustline ? (
                        <><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Adding...</>
                      ) : (
                        "Add Trustline"
                      )}
                    </button>
                  </div>
                </m.div>
              )}

              {hasUSDCTrust && direction === "buy_usdc" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-tertiary/10 border border-tertiary/20 rounded-lg">
                  <span className="text-xs font-ui-label font-semibold text-tertiary">USDC trustline active</span>
                  <span className="font-mono-data text-[10px] text-on-surface-variant truncate">
                    {STELLAR_CONFIG.usdc.issuer.slice(0, 4)}…{STELLAR_CONFIG.usdc.issuer.slice(-4)}
                  </span>
                </div>
              )}

              {step === "input" && (
                <>
                  <div className="bg-bg-void border-2 border-edge-neutral p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-ui-label text-xs uppercase tracking-widest text-ink-secondary">From</span>
                      <span className="font-mono-data text-xs text-ink-tertiary truncate">
                        Balance: {animatedFromBalance.toFixed(2)} {fromLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 min-w-0 text-2xl font-headline-lg font-bold bg-transparent text-ink-primary placeholder:text-ink-tertiary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="shrink-0 font-mono-data text-ink-primary font-bold text-sm px-3 py-1.5 border-2 border-edge-neutral bg-bg-base whitespace-nowrap uppercase tracking-widest">
                        {fromLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center -my-3 relative z-10">
                    <m.button
                      type="button"
                      onClick={handleFlip}
                      animate={{ rotate: isFlipped ? 180 : 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 bg-accent text-bg-base flex items-center justify-center shadow-neopop border-2 border-edge-neutral hover:bg-accent/90 transition-colors"
                    >
                      <ArrowUpDown className="w-5 h-5" />
                    </m.button>
                  </div>

                  <div className="bg-bg-void border-2 border-edge-neutral p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-ui-label text-xs uppercase tracking-widest text-ink-secondary">To</span>
                      <span className="font-mono-data text-xs text-ink-tertiary truncate">
                        Balance: {animatedToBalance.toFixed(2)} {toLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-1 min-w-0 text-2xl font-headline-lg font-bold text-ink-primary truncate">
                        {isQuoteLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-ink-secondary" />
                        ) : quote ? (
                          Number(quote.destinationAmount).toFixed(4)
                        ) : (
                          <span className="text-ink-tertiary">0.00</span>
                        )}
                      </span>
                      <span className="shrink-0 font-mono-data text-ink-primary font-bold text-sm px-3 py-1.5 border-2 border-edge-neutral bg-bg-base whitespace-nowrap uppercase tracking-widest">
                        {toLabel}
                      </span>
                    </div>
                  </div>

                  {priceDisplay && (
                    <p className="text-xs text-ink-secondary font-mono-data text-center">{priceDisplay}</p>
                  )}

                  {quote?.source === "reference_rate" && referenceRateDisplay && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-tertiary/10 border border-tertiary/30 rounded-lg text-xs text-on-surface">
                      <span className="font-ui-label font-semibold text-tertiary shrink-0">Reference rate:</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono-data">{referenceRateDisplay}</p>
                        {quote.warning && (
                          <p className="text-on-surface-variant mt-1 leading-snug">{quote.warning}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {quote?.source === "reference_rate" && ammPool && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface">
                      <span className="font-ui-label font-semibold text-on-surface-variant shrink-0">AMM Pool:</span>
                      <div className="flex-1 min-w-0 font-mono-data">
                        {ammPool.isInitialized ? (
                          <>
                            <span>XLM {ammPool.reserveA.toLocaleString()}</span>
                            <span className="text-on-surface-variant mx-1">/</span>
                            <span>USDC {ammPool.reserveB.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-error">Not initialized - swap uses reference rate only</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="font-ui-label text-xs uppercase tracking-widest text-ink-secondary block mb-2 font-bold">
                      Slippage Tolerance
                    </span>
                    <div className="flex gap-2">
                      {SLIPPAGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSlippage(opt.value)}
                          className={`flex-1 py-1.5 border-2 font-mono-data text-xs font-bold uppercase tracking-widest transition-colors ${
                            slippage === opt.value
                              ? "bg-ink-primary text-bg-base border-ink-primary"
                              : "bg-bg-void text-ink-secondary border-edge-neutral hover:bg-bg-base hover:text-ink-primary"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {Number(amount) > Number(fromBalance) && (
                    <p className="text-xs text-error font-ui-label text-center mb-2 font-bold uppercase tracking-widest">
                      Insufficient Balance
                    </p>
                  )}
                  {forceHorizon && !quote && !isQuoteLoading && amount && Number(amount) > 0 && (
                    <p className="text-xs text-error font-ui-label text-center mb-2 font-bold uppercase tracking-widest">
                      No liquidity on Testnet Orderbooks
                    </p>
                  )}
                  {ammInsufficientLiquidity && !forceHorizon && Number(amount) <= Number(fromBalance) && (
                    <div className="text-center mb-2">
                      <p className="text-xs text-error font-ui-label font-bold uppercase tracking-widest mb-1">
                        Insufficient Pool Liquidity
                      </p>
                      <button 
                        type="button"
                        onClick={() => setForceHorizon(true)}
                        className="text-xs text-ink-secondary underline hover:text-ink-primary font-ui-label"
                      >
                        Try Testnet Fallback Orderbook
                      </button>
                    </div>
                  )}
                  <m.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleReview}
                    disabled={
                      !quote || 
                      !amount || 
                      Number(amount) <= 0 || 
                      isQuoteLoading || 
                      Number(amount) > Number(fromBalance) ||
                      ammInsufficientLiquidity
                    }
                    className="w-full neopop-button-teal py-4 font-ui-label text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                  >
                    Review Swap
                  </m.button>
                </>
              )}

              {step === "review" && quote && (
                <>
                  <div className="space-y-3 p-4 bg-bg-void border-2 border-edge-neutral">
                    <div className="flex justify-between">
                      <span className="font-ui-label text-xs uppercase tracking-widest font-bold text-ink-secondary">You send</span>
                      <span className="font-mono-data text-sm text-ink-primary font-bold">
                        {quote.sourceAmount} {fromLabel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-ui-label text-xs uppercase tracking-widest font-bold text-ink-secondary">You receive (min)</span>
                      <span className="font-mono-data text-sm text-ink-primary font-bold">
                        {destMin} {toLabel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-ui-label text-xs uppercase tracking-widest font-bold text-ink-secondary">Slippage</span>
                      <span className="font-mono-data text-sm text-ink-tertiary">{(slippage * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-ui-label text-xs uppercase tracking-widest font-bold text-ink-secondary">Network Fee</span>
                      <span className="font-mono-data text-sm text-ink-tertiary">~0.00001 XLM</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("input")}
                      className="flex-1 py-4 border-2 border-edge-neutral font-ui-label text-sm font-bold uppercase tracking-widest hover:border-ink-secondary transition-colors"
                    >
                      Back
                    </button>
                    <m.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSignAndSwap}
                      disabled={isSigning}
                      className="flex-1 neopop-button-teal py-4 font-ui-label text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                    >
                      {isSigning ? (
                        <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Signing...</>
                      ) : (
                        "Sign & Swap"
                      )}
                    </m.button>
                  </div>
                </>
              )}

              {step === "signing" && (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="font-ui-label text-sm text-on-surface">Waiting for wallet signature...</p>
                </div>
              )}

              {step === "done" && (
                <div className="py-6 text-center space-y-4">
                  <div>
                    <p className="font-headline-lg text-xl font-bold uppercase tracking-tight text-accent mb-2">Swap Complete</p>
                    <p className="font-ui-label text-sm text-ink-secondary">
                      Your tokens have been swapped on-chain.
                    </p>
                  </div>
                  {lastTxHash && (
                    <div className="mx-auto max-w-sm space-y-1 border-2 border-edge-neutral bg-bg-void p-3 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-ui-label text-[11px] font-bold uppercase tracking-widest text-ink-tertiary">
                          Transaction
                        </span>
                        <a
                          href={getTxExplorerUrl(lastTxHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono-data text-[11px] text-accent hover:text-accent/80 underline shrink-0"
                        >
                          Stellar Expert ↗
                        </a>
                      </div>
                      <p className="font-mono-data text-xs text-ink-primary break-all">
                        {lastTxHash}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-3 border-2 border-edge-neutral font-ui-label text-sm font-bold uppercase tracking-widest hover:border-ink-secondary transition-colors mt-4"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
