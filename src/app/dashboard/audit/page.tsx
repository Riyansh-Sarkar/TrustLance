/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import { getUserContracts } from "@/lib/firebase/contracts";
import { getUserSwapEvents } from "@/lib/firebase/swapEvents";
import type { Contract, ActivityItem } from "@/types";
import { FileText, CheckCircle, Lock, RefreshCw, ArrowLeftRight, Clock, ShieldCheck, ArrowUpRight } from "lucide-react";
import { getTxExplorerUrl } from "@/lib/stellar/explorer";
import { ErrorBoundary } from "@/components/providers/error-boundary";

export default function AuditLogPage() {
  const { isConnected, publicKey } = useWallet();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [swapEvents, setSwapEvents] = useState<Awaited<ReturnType<typeof getUserSwapEvents>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      if (!isConnected || !publicKey) {
        if (active) {
          setContracts([]);
          setSwapEvents([]);
          setIsLoading(false);
        }
        return;
      }
      
      try {
        const [fetchedContracts, fetchedSwaps] = await Promise.all([
          getUserContracts(publicKey),
          getUserSwapEvents(publicKey, 100),
        ]);
        
        if (active) {
          setContracts(fetchedContracts);
          setSwapEvents(fetchedSwaps);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load audit data:", err);
        if (active) setIsLoading(false);
      }
    }

    fetchData();
    return () => { active = false; };
  }, [isConnected, publicKey]);

  const activityItems: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    const safeDateMs = (value: unknown): number | null => {
      if (value == null) return null;
      if (value instanceof Date) {
        const ms = value.getTime();
        return Number.isFinite(ms) ? ms : null;
      }
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
      }
      if (typeof value === "string") {
        const d = new Date(value);
        const ms = d.getTime();
        return Number.isFinite(ms) ? ms : null;
      }
      if (typeof value === "object") {
        const v = value as { toMillis?: () => number; toDate?: () => Date; seconds?: number; nanoseconds?: number };
        if (typeof v.toMillis === "function") {
          const ms = v.toMillis();
          return Number.isFinite(ms) ? ms : null;
        }
        if (typeof v.toDate === "function") {
          const d = v.toDate();
          const ms = d instanceof Date ? d.getTime() : NaN;
          return Number.isFinite(ms) ? ms : null;
        }
        if (typeof v.seconds === "number") {
          const ms = v.seconds * 1000 + Math.floor((v.nanoseconds ?? 0) / 1_000_000);
          return Number.isFinite(ms) ? ms : null;
        }
      }
      return null;
    };

    const formatFullTime = (ms: number | null): string => {
      if (ms == null || !Number.isFinite(ms)) return "—";
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleString("en-US", {
        month: "short", day: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
    };

    contracts.forEach(c => {
      const createdAtMs = safeDateMs(c.createdAt);
      const updatedAtMs = safeDateMs(c.updatedAt);

      items.push({
        icon: FileText, color: "text-ink-primary border-ink-primary", title: "New Contract Created",
        desc: `Contract "${c.title}" has been created.`,
        date: createdAtMs ?? 0,
        time: formatFullTime(createdAtMs),
      });

      c.milestones?.forEach(m => {
        const mUpdatedMs = safeDateMs(c.updatedAt);
        if (m.status === "released" || m.status === "approved") {
          items.push({
            icon: CheckCircle, color: "text-accent border-accent bg-accent/10", title: "Milestone Released",
            desc: `${Number(m.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC released for "${m.description}".`,
            date: mUpdatedMs ?? 0,
            time: formatFullTime(mUpdatedMs),
          });
        } else if (m.status === "submitted") {
          items.push({
            icon: RefreshCw, color: "text-ink-secondary border-ink-secondary", title: "Review Requested",
            desc: `Work submitted for "${m.description}".`,
            date: mUpdatedMs ?? 0,
            time: formatFullTime(mUpdatedMs),
          });
        }
      });

      if (c.isDisputed) {
        items.push({
          icon: Lock, color: "text-status-disputed border-status-disputed bg-status-disputed/10", title: "Dispute Flagged",
          desc: `Contract "${c.title}" has been flagged.`,
          date: updatedAtMs ?? 0,
          time: formatFullTime(updatedAtMs),
        });
      }
    });

    for (const e of swapEvents) {
      const ms = safeDateMs(e.createdAt);
      const label =
        e.direction === "buy_usdc"
          ? `Swapped ${e.sourceAmount} XLM → ${e.destinationAmount} USDC`
          : `Swapped ${e.sourceAmount} USDC → ${e.destinationAmount} XLM`;
      const status = e.status === "completed" ? "completed" : e.status;
      items.push({
        icon: ArrowLeftRight,
        color: e.status === "failed" ? "text-status-disputed border-status-disputed bg-status-disputed/10" : "text-ink-primary border-ink-primary",
        title:
          e.status === "failed"
            ? "Swap Failed"
            : `Swap ${status.charAt(0).toUpperCase()}${status.slice(1)}`,
        desc: e.txHash
          ? `${label} (tx ${e.txHash.slice(0, 6)}…${e.txHash.slice(-4)})`
          : `${label}${e.errorMessage ? ` · ${e.errorMessage}` : ""}`,
        date: ms ?? 0,
        time: formatFullTime(ms),
        txHash: e.txHash,
        explorerUrl: e.txHash ? getTxExplorerUrl(e.txHash) : undefined,
      });
    }

    items.sort((a, b) => b.date - a.date);
    return items;
  }, [contracts, swapEvents]);

  return (
    <ErrorBoundary>
      <div className="p-8 lg:p-12 max-w-7xl mx-auto bg-bg-void min-h-screen text-ink-primary">
        
        <div className="mb-12">
          <h1 className="font-headline-lg text-4xl lg:text-5xl font-bold tracking-tight mb-4">Audit Log</h1>
          <p className="text-ink-secondary font-ui-label text-lg max-w-3xl">A chronological record of all on-chain actions, smart contract updates, and swaps associated with your wallet.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-4 text-ink-tertiary py-20 justify-center">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="font-mono-data uppercase tracking-widest text-sm">Loading ledger history...</span>
          </div>
        ) : (
          <div className="bg-bg-base border border-edge-neutral shadow-neopop p-8 lg:p-12">
            {activityItems.length === 0 ? (
              <div className="text-center py-20 space-y-6">
                <div className="w-24 h-24 border-2 border-edge-neutral bg-bg-void mx-auto flex items-center justify-center text-ink-tertiary">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="font-headline-lg text-3xl font-bold text-ink-primary">No Activity Found</h3>
                <p className="text-ink-secondary max-w-sm mx-auto font-ui-label text-sm">
                  We couldn't find any recent contracts, milestones, or swaps associated with your connected wallet.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-edge-neutral ml-6 space-y-12 pb-8">
                {activityItems.map((item, i) => {
                  const Icon = item.icon as React.ComponentType<{ className?: string }>;
                  return (
                    <div key={`${item.title}-${i}`} className="relative pl-12">
                      <div className={`absolute -left-[26px] top-0 w-12 h-12 border-2 bg-bg-base flex items-center justify-center z-10 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="bg-bg-void border-2 border-edge-neutral p-6 hover:border-ink-secondary transition-colors group">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div>
                            <p className="font-ui-label text-lg font-bold text-ink-primary uppercase tracking-widest mb-2">
                              {item.title}
                            </p>
                            <p className="text-sm font-mono-data text-ink-secondary leading-relaxed">{item.desc}</p>
                          </div>
                          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                            <span className="flex items-center gap-2 text-xs font-mono-data font-bold text-ink-tertiary uppercase tracking-widest">
                              <Clock className="w-4 h-4" />
                              {item.time}
                            </span>
                          </div>
                        </div>
                        {item.explorerUrl && item.txHash && (
                          <div className="mt-6 pt-4 border-t-2 border-edge-neutral border-dashed flex items-center gap-4">
                            <span className="text-xs text-ink-secondary font-mono-data uppercase tracking-widest">TX HASH</span>
                            <a
                              href={item.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono-data font-bold text-accent hover:text-white flex items-center gap-1 group/link"
                              title={item.txHash}
                            >
                              {item.txHash.slice(0, 8)}…{item.txHash.slice(-6)}
                              <ArrowUpRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
