/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, type ComponentType } from "react";
import { Wallet, Lock, Clock, Code, FileText, ArrowUpRight, ArrowDownLeft, Plus, ArrowLeftRight } from "lucide-react";
import { m } from "framer-motion";
import { KpiCard } from "@/components/features/KpiCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "sonner";
import type { Contract, ActivityItem } from "@/types";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  },
};

interface DashboardHeaderProps {
  isConnected: boolean;
  publicKey: string | null;
  today: string;
  openModal: () => void;
  setRampType: (type: "deposit" | "withdraw") => void;
  setIsRampOpen: (open: boolean) => void;
  setIsSwapOpen?: (open: boolean) => void;
  setSwapDirection?: (dir: "buy_usdc" | "sell_usdc") => void;
}

export function DashboardHeader({ isConnected, publicKey, today, openModal, setRampType, setIsRampOpen, setIsSwapOpen, setSwapDirection }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-section-gap pt-8 px-4 md:px-margin-desktop"
    >
      <div>
        <p className="font-ui-label text-ink-tertiary mb-1 text-xs uppercase tracking-widest">{today}</p>
        <h2 className="font-headline-lg text-4xl tracking-tight text-ink-primary font-bold">
          {isConnected ? `${greeting}.` : `${greeting}.`}
        </h2>
      </div>
      <div className="flex flex-wrap gap-3">
        {!isConnected ? (
          <button
            onClick={openModal}
            type="button"
            className="px-4 py-2 bg-bg-interactive border border-edge-neutral rounded-xl font-ui-label text-sm text-ink-primary flex items-center gap-2 hover:bg-bg-interactive transition-colors font-medium cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        ) : (
          <div className="px-3 py-2 bg-accent-glow border border-accent/20 rounded-xl text-accent font-mono-data text-xs font-medium flex items-center h-[38px]">
            Connected as {publicKey?.substring(0, 6)}…{publicKey?.substring(publicKey.length - 4)}
          </div>
        )}
        <button
          type="button"
          onClick={() => { setRampType("deposit"); setIsRampOpen(true); }}
          className="neopop-button-teal px-4 py-2 font-ui-label text-sm font-medium flex items-center gap-2"
        >
          <ArrowDownLeft className="w-4 h-4" />
          Deposit
        </button>
        {setIsSwapOpen && (
          <button
            type="button"
            onClick={() => { setSwapDirection?.("buy_usdc"); setIsSwapOpen(true); }}
            className="px-4 py-2 bg-bg-interactive border border-edge-neutral rounded-xl font-ui-label text-sm text-ink-primary flex items-center gap-2 hover:bg-bg-interactive transition-colors font-medium cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Swap
          </button>
        )}
        <button
          type="button"
          onClick={() => { setRampType("withdraw"); setIsRampOpen(true); }}
          className="px-4 py-2 bg-bg-interactive border border-edge-neutral rounded-xl font-ui-label text-sm text-ink-primary flex items-center gap-2 hover:bg-bg-interactive transition-colors font-medium cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" />
          Withdraw
        </button>
      </div>
    </m.div>
  );
}

const BALANCE_ICON = <Wallet className="w-4 h-4 text-accent" />;
const BALANCE_SUB = <span className="text-accent">Available balance</span>;
const ESCROW_ICON = <Lock className="w-4 h-4 text-ink-primary" />;
const PAYOUT_ICON = <Clock className="w-4 h-4 text-ink-secondary" />;
const PAYOUT_SUB = <span className="text-ink-secondary">Est. arrival: 2 days</span>;

interface KpiStripProps {
  isFetching: boolean;
  balanceRaw: number;
  escrowAmount: number;
  escrowCount: number;
  pendingPayouts: number;
}

export function KpiStrip({ isFetching, balanceRaw, escrowAmount, escrowCount, pendingPayouts }: KpiStripProps) {
  const escrowSub = React.useMemo(() => <span className="text-ink-primary">{escrowCount} Active Milestones</span>, [escrowCount]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-section-gap px-4 md:px-margin-desktop">
      {isFetching ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-bg-base border border-edge-neutral p-6 rounded-[20px] space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))
      ) : (
        <>
          <KpiCard
            label="Available Balance" value={balanceRaw} unit="USDC" delay={0}
            accent="primary"
            subIcon={BALANCE_ICON}
            sub={BALANCE_SUB}
          />
          <KpiCard
            label="Escrowed Amount" value={escrowAmount} unit="USDC" delay={0.08}
            accent="secondary"
            subIcon={ESCROW_ICON}
            sub={escrowSub}
          />
          <KpiCard
            label="Pending Payouts" value={pendingPayouts} unit="USDC" delay={0.16}
            accent="tertiary"
            subIcon={PAYOUT_ICON}
            sub={PAYOUT_SUB}
          />
        </>
      )}
    </div>
  );
}

interface ContractsActionListProps {
  contracts: Contract[];
  isFetching: boolean;
  publicKey: string | null;
  isLoading: boolean;
  isConnected: boolean;
  router: AppRouterInstance;
  onFundContract: (contract: Contract) => void;
  onCompleteWork: (milestoneId: number) => void;
}

export function ContractsActionList({ contracts, isFetching, publicKey, isLoading, isConnected, router, onFundContract, onCompleteWork }: ContractsActionListProps) {
  return (
    <section className="px-4 md:px-margin-desktop mb-section-gap">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-ui-label text-sm uppercase tracking-widest text-ink-primary font-bold">Requires your attention</h3>
        <button type="button" className="text-accent font-mono-data text-xs uppercase tracking-wider hover:underline underline-offset-2 transition-all">View all</button>
      </div>
           <m.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
        {contracts.length === 0 && !isFetching && (
          <div className="text-center py-12 border border-edge-neutral border-dashed rounded-[20px] bg-bg-base">
            <div className="w-10 h-10 bg-bg-interactive rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-4 h-4 text-ink-secondary" />
            </div>
            <h3 className="font-ui-label text-base font-medium text-ink-primary mb-1">No Active Contracts</h3>
            <p className="text-sm text-ink-secondary mb-6 max-w-[250px] mx-auto">Create a contract to safely escrow funds.</p>
            <button 
              type="button"
              onClick={() => router.push('/dashboard/contracts/new')}
              className="neopop-button-teal px-4 py-2 font-ui-label text-sm font-medium flex items-center justify-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" /> Create Contract
            </button>
          </div>
        )}
        {contracts.slice(0, 3).map((c) => {
          const isClient = c.clientWallet === publicKey;
          const counterparty = isClient ? c.freelancerWallet : c.clientWallet;
          
          let actionLabel = "";
          let actionTooltip = "";
          let actionAction: (() => void) | null = null;

          const firstActionableMilestone = (c.milestones || []).find(m => {
            if (isClient) return m.status === "pending" || m.status === "submitted";
            return m.status === "pending";
          });

          if (firstActionableMilestone) {
            if (isClient) {
              if (firstActionableMilestone.status === "pending") {
                actionLabel = "Fund Contract";
                actionTooltip = "Securely lock funds in the smart contract.";
                actionAction = () => onFundContract(c);
              } else if (firstActionableMilestone.status === "submitted") {
                actionLabel = "Review Work";
                actionTooltip = "Review the submitted work and release funds.";
                actionAction = () => router.push(`/dashboard/contracts/${c.id}`);
              }
            } else {
              if (firstActionableMilestone.status === "pending") {
                actionLabel = "Complete Work";
                actionTooltip = "Submit your work for review.";
                actionAction = () => onCompleteWork(Number(firstActionableMilestone.id));
              }
            }
          }
          
          const isActiveRow = actionLabel !== "";

          return (
          <m.div
            key={c.id}
            variants={stagger.item}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              router.push(`/dashboard/contracts/${c.id}`);
            }}
            className={`group p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer border rounded-[20px] shadow-sm ${isActiveRow ? 'bg-accent-glow border-accent/40 hover:bg-accent-glow/70' : 'bg-bg-base border-edge-neutral hover:bg-bg-overlay'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActiveRow ? 'bg-accent/15 text-accent' : 'bg-bg-interactive text-ink-secondary'}`}>
                <Code className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-ui-label font-semibold text-ink-primary mb-1 text-sm">{c.title}</h4>
                <p className="text-ink-tertiary text-xs font-mono-data uppercase tracking-wider truncate max-w-[200px] sm:max-w-[250px]">
                  With: <span className="text-ink-secondary font-medium">{counterparty.substring(0, 8)}...</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {c.totalAmount > 0 && (
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-ink-tertiary font-mono-data uppercase tracking-widest mb-0.5 font-medium">Value</p>
                  <p className="font-mono-data text-sm font-semibold text-ink-primary">{c.totalAmount} USDC</p>
                </div>
              )}
              {actionLabel && actionAction && (
                <button
                  type="button"
                  onClick={actionAction}
                  disabled={isLoading || !isConnected}
                  title={actionTooltip}
                  className="neopop-button-teal px-4 py-2 font-ui-label text-xs font-medium disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {isLoading ? "Processing..." : actionLabel}
                </button>
              )}
            </div>
          </m.div>
          );
        })}
      </m.div>
    </section>
  );
}

interface UpcomingMilestonesProps {
  contracts: Contract[];
  isFetching: boolean;
}

export function UpcomingMilestones({ contracts, isFetching }: UpcomingMilestonesProps) {
  const allMilestones = contracts
    .filter((c) => !c.isClosed && !c.isDisputed)
    .flatMap((c) => (c.milestones || []).map((m) => ({ ...m, contractTitle: c.title })))
    .filter((m) => m.status === "pending" || m.status === "submitted")
    .slice(0, 5);

  return (
    <section className="px-4 md:px-margin-desktop mb-section-gap">
      <h3 className="font-ui-label text-sm uppercase tracking-wider text-ink-primary font-medium mb-6">Upcoming Milestones</h3>
      <div className="bg-bg-base border border-edge-neutral rounded-[20px] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-bg-overlay/50 border-b border-edge-neutral">
            <tr>
              {["Milestone", "Contract", "Amount", "Status"].map((h, i) => (
                <th key={h} className={`py-4 px-5 font-mono-data text-[10px] uppercase tracking-wider text-ink-secondary font-medium ${i === 3 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge-neutral bg-bg-base">
            {allMilestones.length === 0 && !isFetching && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-ink-tertiary font-ui-label text-sm">
                  No upcoming milestones.
                </td>
              </tr>
            )}
            {allMilestones.map((m) => (
              <tr
                key={`ms-${m.id}-${m.contractTitle}`}
                className="transition-colors cursor-default hover:bg-bg-overlay/40"
              >
                <td className="py-4 px-5">
                  <p className="font-ui-label text-sm font-semibold text-ink-primary">{m.description}</p>
                  <p className="font-mono-data text-[10px] text-ink-tertiary mt-1 uppercase tracking-wider">Milestone {m.id}</p>
                </td>
                <td className="py-4 px-5 font-ui-label text-sm text-ink-secondary">{m.contractTitle}</td>
                <td className="py-4 px-5 font-mono-data text-sm font-medium text-ink-primary">{m.amount} <span className="text-ink-tertiary font-normal">USDC</span></td>
                <td className="py-4 px-5 text-right">
                  <StatusBadge status={m.status === "pending" ? "In Progress" : m.status === "submitted" ? "In Review" : m.status === "approved" ? "Completed" : "Scheduled"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface RecentActivityProps {
  activityItems: ActivityItem[];
  onViewFullAuditLog?: () => void;
}

export function RecentActivity({ activityItems, onViewFullAuditLog }: RecentActivityProps) {
  return (
    <section className="px-4 md:px-margin-desktop mb-section-gap">
      <h3 className="font-ui-label text-sm uppercase tracking-wider text-ink-primary font-medium mb-6">Recent Activity</h3>
      <div className="bg-bg-base border border-edge-neutral rounded-[20px] p-6 shadow-sm">
        <m.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="space-y-6 relative before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-edge-neutral"
        >
          {activityItems.length === 0 && (
            <p className="text-sm text-ink-tertiary pl-10 pt-2 font-ui-label">No recent activity found.</p>
          )}
          {activityItems.map((item, i) => {
            const Icon = item.icon as ComponentType<{ className?: string }>;
            return (
              <m.div key={`${item.title}-${i}`} variants={stagger.item} className="relative pl-10">
                <div className={`absolute left-0.5 top-1 w-5 h-5 rounded-full ${item.color.replace('bg-surface-container-lowest', 'bg-bg-void')} flex items-center justify-center z-10 border-2 border-bg-base`}>
                  <Icon className="text-ink-primary w-2.5 h-2.5" />
                </div>
                <p className="text-sm font-semibold text-ink-primary font-ui-label mb-1">{item.title}</p>
                <p className="text-xs text-ink-secondary leading-relaxed font-ui-label">{item.desc}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-[10px] text-ink-tertiary font-mono-data uppercase tracking-widest">{item.time}</p>
                  {item.explorerUrl && item.txHash && (
                    <a
                      href={item.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono-data text-accent hover:underline truncate max-w-[180px] uppercase tracking-wider font-medium"
                      title={item.txHash}
                    >
                      {item.txHash.slice(0, 6)}…{item.txHash.slice(-4)} ↗
                    </a>
                  )}
                </div>
              </m.div>
            );
          })}
        </m.div>
        <button
          type="button"
          onClick={() => {
            if (onViewFullAuditLog) {
              onViewFullAuditLog();
            } else {
              toast.info("Full audit log coming soon.");
            }
          }}
          className="w-full mt-6 py-3 bg-bg-interactive border border-edge-neutral rounded-xl font-ui-label text-xs font-medium text-ink-primary uppercase tracking-wider hover:bg-edge-neutral transition-all cursor-pointer shadow-sm"
        >
          View Full Audit Log
        </button>
      </div>
    </section>
  );
}

interface AccountHealthProps {
  contractCompletionPct?: number;
}

export function AccountHealth({ contractCompletionPct = 0 }: AccountHealthProps) {
  const [progressMounted, setProgressMounted] = useState(false);
  
  useEffect(() => {
    const t = setTimeout(() => setProgressMounted(true), 400);
    return () => clearTimeout(t);
  }, []);

  const healthBars = [
    { label: "Contract Completion", value: contractCompletionPct, suffix: `${contractCompletionPct}%` }
  ];

  return (
    <section className="bg-accent-glow border border-accent/20 p-6 rounded-[20px] mx-4 md:mx-margin-desktop mb-section-gap shadow-sm">
      <h4 className="font-mono-data text-[10px] text-accent uppercase tracking-wider font-semibold mb-4">Account Health</h4>
      <div className="space-y-5">
        {healthBars.map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs font-medium font-ui-label mb-2">
              <span className="text-ink-primary uppercase tracking-wide">{bar.label}</span>
              <span className={`font-mono-data ${bar.value > 0 ? 'text-accent' : 'text-ink-tertiary'}`}>{bar.suffix}</span>
            </div>
            <div className="w-full h-2 bg-bg-interactive rounded-full overflow-hidden">
              <m.div
                className="h-full bg-accent origin-left rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progressMounted ? bar.value / 100 : 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}