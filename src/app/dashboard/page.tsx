/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useEscrow } from "@/hooks/useEscrow";
import { getAccountBalance, getAccountTrustlines } from "@/lib/stellar/client";
import { getUserContracts } from "@/lib/firebase/contracts";
import type { Contract, ActivityItem } from "@/types";
import { RampModal } from "@/components/RampModal";
import { SwapModal } from "@/components/SwapModal";
import { TrustlineBanner } from "@/components/TrustlineBanner";
import { CustomWalletModal } from "@/components/CustomWalletModal";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { getUserSwapEvents } from "@/lib/firebase/swapEvents";
import { 
  DashboardHeader, KpiStrip, ContractsActionList, 
  UpcomingMilestones, RecentActivity, AccountHealth 
} from "@/components/dashboard/dashboard-components";
import { FileText, CheckCircle, Lock, RefreshCw, ArrowLeftRight } from "lucide-react";
import { getTxExplorerUrl } from "@/lib/stellar/explorer";

export default function DashboardPage() {
  const { isConnected, openModal, closeModal, isModalOpen, connectWallet, supportedWallets, publicKey } = useWallet();
  const { state: escrowState, approveMilestone, submitMilestone, fundContract, isLoading } = useEscrow();
  const [state, setState] = useState({
    balanceRaw: 0,
    balanceError: null as string | null,
    contracts: [] as Contract[],
    isRampOpen: false,
    rampType: "deposit" as "deposit" | "withdraw",
    isSwapOpen: false,
    swapDirection: "buy_usdc" as "buy_usdc" | "sell_usdc",
    hasUSDCTrustline: false,
    swapEvents: [] as Awaited<ReturnType<typeof getUserSwapEvents>>,
  });
  const { balanceRaw, balanceError, contracts, isRampOpen, rampType, isSwapOpen, swapDirection, hasUSDCTrustline, swapEvents } = state;
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(false);

  const syncContracts = useCallback(async (userContracts: Contract[]) => {
    if (!escrowState || userContracts.length === 0) return userContracts;

    // Only sync if the on-chain state actually has milestones
    // An uninitialized or empty escrow state should not overwrite Firestore
    if (!escrowState.milestones || escrowState.milestones.length === 0) {
      return userContracts;
    }

    const activeContract = userContracts.find(
      c => c.contractAddress && escrowState
    );
    if (!activeContract?.milestones) return userContracts;

    // Define valid status progression order — a status can only move forward
    const STATUS_ORDER: Record<string, number> = {
      pending: 0,
      submitted: 1,
      approved: 2,
      released: 3,
      disputed: 4,
    };

    let hasMismatch = false;
    const syncedContracts = [...userContracts];
    const syncedActive = { ...activeContract, milestones: [...activeContract.milestones] };

    escrowState.milestones.forEach((onChainMilestone) => {
      const idx = Number(onChainMilestone.id);
      let onChainStatus = "";
      const statusVal = onChainMilestone.status as any;
      if (typeof statusVal === 'string') {
        onChainStatus = statusVal.toLowerCase();
      } else if (typeof statusVal === 'number') {
        const statuses = ["pending", "submitted", "approved", "released", "disputed"];
        onChainStatus = statuses[statusVal] || "";
      } else if (statusVal?.tag) {
        onChainStatus = statusVal.tag.toLowerCase();
      }

      // Skip if we couldn't determine a valid on-chain status
      if (!onChainStatus || !(onChainStatus in STATUS_ORDER)) return;

      const localMilestone = syncedActive.milestones[idx];
      if (!localMilestone) return;

      // Only sync if:
      // 1. The statuses actually differ
      // 2. The on-chain status is a valid FORWARD progression from the local status
      //    (prevents jumping from "pending" to "approved", skipping client review)
      const localOrder = STATUS_ORDER[localMilestone.status] ?? -1;
      const onChainOrder = STATUS_ORDER[onChainStatus] ?? -1;

      if (localMilestone.status !== onChainStatus && onChainOrder > localOrder && onChainOrder - localOrder === 1) {
        hasMismatch = true;
        syncedActive.milestones[idx] = { ...localMilestone, status: onChainStatus as Contract["milestones"][number]["status"] };
        import("@/lib/firebase/contracts").then(m => m.updateMilestoneStatus(activeContract.id, idx, onChainStatus as Parameters<typeof m.updateMilestoneStatus>[2]));
      }
    });

    const allCompleted = syncedActive.milestones && syncedActive.milestones.length > 0 && syncedActive.milestones.every(m => m.status === "approved" || m.status === "released");
    
    if (allCompleted && !syncedActive.isClosed) {
      syncedActive.isClosed = true;
      import("@/lib/firebase/contracts").then(m => m.updateContract(activeContract.id, { isClosed: true }));
      hasMismatch = true; // Force a state update
    }

    if (hasMismatch) {
      const idx = syncedContracts.findIndex(c => c.id === activeContract.id);
      if (idx >= 0) syncedContracts[idx] = syncedActive;
      return syncedContracts;
    }
    return userContracts;
  }, [escrowState]);

  useEffect(() => {
    let active = true;
    if (isConnected && publicKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFetching(true);
      Promise.all([
        getAccountBalance(publicKey, "USDC"),
        getUserContracts(publicKey),
        getAccountTrustlines(publicKey),
        getUserSwapEvents(publicKey, 10),
      ])
        .then(async ([balanceResult, userContracts, trustResult, swapEvts]) => {
          if (!active) return;
          const synced = await syncContracts(userContracts);
          setState(prev => ({
            ...prev,
            balanceRaw: Number(balanceResult.balance) || 0,
            balanceError: balanceResult.error,
            contracts: synced,
            hasUSDCTrustline: trustResult.hasUSDCTrustline,
            swapEvents: swapEvts,
          }));
        })
        .finally(() => {
          if (active) setIsFetching(false);
        });
    } else {
      setState(prev => ({ ...prev, balanceRaw: 0, balanceError: null, contracts: [], swapEvents: [] }));
    }
    return () => { active = false; };
  }, [isConnected, publicKey, syncContracts]);

  const refreshDashboard = useCallback(async () => {
    if (!publicKey) return;
    setIsFetching(true);
    try {
      const [balanceResult, userContracts, trustResult, swapEvts] = await Promise.all([
        getAccountBalance(publicKey, "USDC"),
        getUserContracts(publicKey),
        getAccountTrustlines(publicKey),
        getUserSwapEvents(publicKey, 10),
      ]);
      const synced = await syncContracts(userContracts);
      setState(prev => ({
        ...prev,
        balanceRaw: Number(balanceResult.balance) || 0,
        balanceError: balanceResult.error,
        contracts: synced,
        hasUSDCTrustline: trustResult.hasUSDCTrustline,
        swapEvents: swapEvts,
      }));
    } finally {
      setIsFetching(false);
    }
  }, [publicKey, syncContracts]);

  let escrowAmount = 0;
  let escrowCount = 0;
  let pendingPayouts = 0;
  const contractsNeedingAction = [];

  for (const c of contracts) {
    if (!c.isClosed && !c.isDisputed) {
      let contractNeedsAction = false;
      const isClient = c.clientWallet === publicKey;

      for (const m of (c.milestones || [])) {
        if (["pending", "submitted"].includes(m.status)) {
          escrowAmount += Number(m.amount || 0);
          escrowCount += 1;
          pendingPayouts += Number(m.amount || 0);
        }

        if (isClient) {
          // Client needs to fund if pending, or approve if submitted
          if (m.status === "pending" || m.status === "submitted") contractNeedsAction = true;
        } else {
          // Freelancer needs to complete work if pending (which implies funded in this demo)
          if (m.status === "pending") contractNeedsAction = true;
        }
      }

      if (contractNeedsAction) {
        contractsNeedingAction.push(c);
      }
    }
  }

  const today = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    React.useCallback(() => new Date().toLocaleDateString("en-US", {
      weekday: "long", month: "short", day: "numeric", year: "numeric",
    }), []),
    React.useCallback(() => "", [])
  );
  const activityItems: ActivityItem[] = React.useMemo(() => {
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
    const formatTime = (ms: number | null): string => {
      if (ms == null || !Number.isFinite(ms)) return "—";
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) return "—";
      const now = Date.now();
      const diffMs = now - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    contracts.forEach(c => {
      const createdAtMs = safeDateMs(c.createdAt);
      const updatedAtMs = safeDateMs(c.updatedAt);

      items.push({
        icon: FileText, color: "bg-tertiary", title: "New Contract Created",
        desc: `Contract "${c.title}" has been finalized.`,
        date: createdAtMs ?? 0,
        time: formatTime(createdAtMs),
      });

      c.milestones?.forEach(m => {
        const mUpdatedMs = safeDateMs(c.updatedAt);
        if (m.status === "released" || m.status === "approved") {
          items.push({
            icon: CheckCircle, color: "bg-primary", title: "Milestone Released",
            desc: `${m.amount} USDC released for "${m.description}".`,
            date: mUpdatedMs ?? 0,
            time: formatTime(mUpdatedMs),
          });
        } else if (m.status === "submitted") {
          items.push({
            icon: RefreshCw, color: "bg-outline", title: "Review Requested",
            desc: `Work submitted for "${m.description}".`,
            date: mUpdatedMs ?? 0,
            time: formatTime(mUpdatedMs),
          });
        }
      });

      if (c.isDisputed) {
        items.push({
          icon: Lock, color: "bg-error", title: "Dispute Flagged",
          desc: `Contract "${c.title}" has been flagged.`,
          date: updatedAtMs ?? 0,
          time: formatTime(updatedAtMs),
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
        color: e.status === "failed" ? "bg-error" : "bg-secondary",
        title:
          e.status === "failed"
            ? "Swap Failed"
            : `Swap ${status.charAt(0).toUpperCase()}${status.slice(1)}`,
        desc: e.txHash
          ? `${label} · tx ${e.txHash.slice(0, 6)}…${e.txHash.slice(-4)}`
          : `${label}${e.errorMessage ? ` · ${e.errorMessage}` : ""}`,
        date: ms ?? 0,
        time: formatTime(ms),
        txHash: e.txHash,
        explorerUrl: e.txHash ? getTxExplorerUrl(e.txHash) : undefined,
      });
    }

    items.sort((a, b) => b.date - a.date);
    return items.slice(0, 4);
  }, [contracts, swapEvents]);

  const handleFundContract = useCallback(async (c: Contract) => {
    try {
      const result = await fundContract(
        c.id,
        c.freelancerWallet,
        [c.totalAmount],
        [c.description || "Milestone"]
      );
      const txHash = (result as { hash?: string })?.hash || "pending";
      const { updateContract } = await import("@/lib/firebase/contracts");
      await updateContract(c.id, { contractAddress: txHash });
      setState(prev => ({
        ...prev,
        contracts: prev.contracts.map(item => item.id === c.id ? { ...item, contractAddress: txHash } : item)
      }));
    } catch (err) {
      console.error("Dashboard fundContract error:", err);
    }
  }, [fundContract]);

  const contractCompletionPct = useMemo(() => {
    const total = contracts.length;
    if (total === 0) return 0;
    const closed = contracts.filter(c => c.isClosed).length;
    return Math.round((closed / total) * 100);
  }, [contracts]);

  return (
    <ErrorBoundary>
      <div className="w-full">
        <DashboardHeader 
          isConnected={isConnected} 
          publicKey={publicKey} 
          today={today} 
          openModal={openModal} 
          setRampType={(type: "deposit" | "withdraw") => setState(prev => ({ ...prev, rampType: type }))} 
          setIsRampOpen={(open: boolean) => setState(prev => ({ ...prev, isRampOpen: open }))} 
          setIsSwapOpen={(open: boolean) => setState(prev => ({ ...prev, isSwapOpen: open }))}
          setSwapDirection={(dir: "buy_usdc" | "sell_usdc") => setState(prev => ({ ...prev, swapDirection: dir }))}
        />

        {isConnected && publicKey && !hasUSDCTrustline && (
          <TrustlineBanner
            publicKey={publicKey}
            onTrustlineAdded={() => setState(prev => ({ ...prev, hasUSDCTrustline: true }))}
          />
        )}

        {balanceError && (
          <p className="text-xs text-status-disputed mb-2 px-4 md:px-margin-desktop">{balanceError}</p>
        )}

        <RampModal
          isOpen={isRampOpen}
          onClose={() => setState(prev => ({ ...prev, isRampOpen: false }))}
          type={rampType}
          onSwapInstead={() => setState(prev => ({ ...prev, isRampOpen: false, isSwapOpen: true, swapDirection: rampType === "deposit" ? "buy_usdc" : "sell_usdc" }))}
        />
        <SwapModal
          isOpen={isSwapOpen}
          onClose={() => setState(prev => ({ ...prev, isSwapOpen: false }))}
          defaultDirection={swapDirection}
          onSwapComplete={() => { void refreshDashboard(); }}
        />
        <CustomWalletModal isOpen={isModalOpen} onClose={closeModal} wallets={supportedWallets} onSelect={connectWallet} />

        <KpiStrip 
          isFetching={isFetching} 
          balanceRaw={balanceRaw} 
          escrowAmount={escrowAmount} 
          escrowCount={escrowCount} 
          pendingPayouts={pendingPayouts} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4 md:px-margin-desktop">
          <div className="lg:col-span-8 space-y-8">
            <ContractsActionList 
              contracts={contractsNeedingAction} 
              isFetching={isFetching} 
              publicKey={publicKey} 
              isLoading={isLoading} 
              isConnected={isConnected} 
              router={router} 
              onFundContract={handleFundContract}
            />
            <UpcomingMilestones contracts={contracts} isFetching={isFetching} />
          </div>

          <div className="lg:col-span-4 space-y-8">
            <RecentActivity 
              activityItems={activityItems} 
              onViewFullAuditLog={() => router.push('/dashboard/audit')}
            />
            <AccountHealth contractCompletionPct={contractCompletionPct} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}