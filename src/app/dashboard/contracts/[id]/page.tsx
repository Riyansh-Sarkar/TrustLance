"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useEscrow } from "@/hooks/useEscrow";
import { getContract, updateMilestoneStatus, flagDispute, updateContract } from "@/lib/firebase/contracts";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import type { Contract, MilestoneStatus } from "@/types";
import Link from "next/link";
import { useAnalytics } from "@/hooks/useAnalytics";
import { logTransactionEvent } from "@/lib/firebase/growth";

import { ArrowLeft, Loader2, AlertCircle, ShieldAlert, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { ChatWidget } from "@/components/dashboard/ChatWidget";
import { ContractReviewWidget } from "@/components/dashboard/ContractReviewWidget";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function ContractDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { isConnected, publicKey } = useWallet();
  const { trackMilestoneSubmitted, trackMilestoneApproved, trackInviteSent } = useAnalytics();
  const contractAuto = useEscrow(id);
  const {
    approveMilestone,
    submitMilestone: onChainSubmitMilestone,
    fundContract,
    isLoading: isEscrowLoading,
    flagDispute: onChainFlagDispute,
    resolveDispute: onChainResolveDispute,
    cancelContract: onChainCancelContract,
    state: escrowState,
  } = contractAuto;

  const [contract, setContract] = useState<Contract | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [isDisputeFlowOpen, setIsDisputeFlowOpen] = useState(false);
  const [isFlaggingDispute, setIsFlaggingDispute] = useState(false);
  const [isResolvingDispute, setIsResolvingDispute] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [resolveForm, setResolveForm] = useState({ releaseTo: "", amount: "" });

  const contractIsAccepted = contract?.isAccepted !== false;

  const submittingWorkRef = useRef(false);
  const approvingMilestoneRef = useRef(false);
  const acceptingContractRef = useRef(false);
  const fundingEscrowRef = useRef(false);
  const cancellingContractRef = useRef(false);

  const handleFundEscrow = async () => {
    if (!contract || fundingEscrowRef.current) return;
    fundingEscrowRef.current = true;
    try {
      const result = await fundContract(
        contract.id,
        contract.freelancerWallet,
        contract.milestones.map(m => m.amount),
        contract.milestones.map(m => m.description)
      );
      const txHash = (result as { hash?: string })?.hash || "pending";
      await updateContract(contract.id, { contractAddress: txHash });
      setContract(prev => prev ? { ...prev, contractAddress: txHash } : null);
      toast.success("Escrow funded successfully!");
      router.refresh();
    } catch (err) {
      console.error("Detail page fundEscrow error:", err);
    } finally {
      fundingEscrowRef.current = false;
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchContract = async () => {
      try {
        const data = await getContract(id);
        if (data) {
          setContract(data);
          if (data.milestones?.[0]?.deliverableUrl) {
            setDeliverableUrl(data.milestones[0].deliverableUrl);
          }
        }
      } catch {
        toast.error("Could not load contract details");
      } finally {
        setIsFetching(false);
      }
    };

    fetchContract();
  }, [id]);

  const isClient = contract?.clientWallet === publicKey;
  const isFreelancer = contract?.freelancerWallet === publicKey;

  const activeMilestoneIndex = contract?.milestones?.findIndex(m => m.status === "pending" || m.status === "submitted") ?? -1;
  const activeMilestone = activeMilestoneIndex !== -1 ? contract?.milestones?.[activeMilestoneIndex] : null;
  const currentStatus = activeMilestone?.status;

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableUrl || !contract || activeMilestoneIndex === -1 || submittingWorkRef.current) return;

    if (activeMilestone?.status !== "pending") {
      toast.error("This milestone has already been submitted and is awaiting client approval.");
      return;
    }

    submittingWorkRef.current = true;
    setIsSubmittingWork(true);

    console.log("[debug] handleSubmitWork pre-flight diagnostic:", {
      contractId: contract.id,
      milestoneIndex: activeMilestoneIndex,
      currentMilestoneStatus: activeMilestone?.status,
      contractStatus: contract.contractAddress ? "Funded" : "Accepted",
      walletAddress: publicKey,
      firestoreStatus: activeMilestone?.status,
      sorobanStatus: escrowState?.milestones?.[activeMilestoneIndex]?.status,
    });

    try {
      await onChainSubmitMilestone(activeMilestoneIndex);

      if (publicKey) {
        await logTransactionEvent({
          contractId: contract.id,
          type: "milestone_submitted",
          walletAddress: publicKey,
        });
      }

      await updateMilestoneStatus(contract.id, activeMilestoneIndex, "submitted", deliverableUrl);
      setContract(prev => prev ? {
        ...prev,
        milestones: prev.milestones.map((m, i) => i === activeMilestoneIndex ? { ...m, status: "submitted" as const, deliverableUrl } : m)
      } : null);
      if (publicKey) trackMilestoneSubmitted(publicKey, contract.id, activeMilestoneIndex);
      toast.success("Work submitted for review!");
      window.dispatchEvent(new CustomEvent('open-feedback-modal', { detail: { action: 'submit_milestone' } }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit work. Please try again.");
    } finally {
      submittingWorkRef.current = false;
      setIsSubmittingWork(false);
    }
  };

  const handleApproveMilestone = async () => {
    if (!contract || activeMilestoneIndex === -1 || approvingMilestoneRef.current) return;
    approvingMilestoneRef.current = true;

    console.log("=== PRE-APPROVAL DIAGNOSTIC LOG ===");
    console.log("Connected Freighter wallet:", publicKey);
    console.log("Transaction signer:", publicKey);
    console.log("Client wallet from Firestore:", contract.clientWallet);
    console.log("Freelancer wallet from Firestore:", contract.freelancerWallet);
    console.log("Client stored inside Soroban contract:", escrowState?.client);
    console.log("Freelancer stored inside Soroban contract:", escrowState?.freelancer);
    console.log("Contract owner (admin stored inside Soroban):", escrowState?.admin);
    console.log("Current milestone status:", activeMilestone?.status);
    console.log("Current contract status:", contract.contractAddress ? "Funded" : "Unfunded");
    console.log("Contract ID:", contract.id);
    console.log("====================================");

    try {
      await approveMilestone(activeMilestoneIndex);
      if (publicKey) {
        await logTransactionEvent({
          contractId: contract.id,
          type: "milestone_approved",
          walletAddress: publicKey,
        });
        trackMilestoneApproved(publicKey, contract.id, activeMilestoneIndex);
      }
      toast.success("Funds released successfully!");
      window.dispatchEvent(new CustomEvent('open-feedback-modal', { detail: { action: 'approve_milestone' } }));
      setContract(prev => {
        if (!prev) return null;
        const newMilestones = prev.milestones.map((m, i) => i === activeMilestoneIndex ? { ...m, status: "approved" as const } : m);
        const isClosed = newMilestones.every(m => m.status === "approved" || m.status === "released");
        return {
          ...prev,
          milestones: newMilestones,
          isClosed: prev.isClosed || isClosed
        };
      });
      await updateMilestoneStatus(contract.id, activeMilestoneIndex, "approved");
      router.refresh();
    } catch { /* toast already shown by hook */ }
    finally {
      approvingMilestoneRef.current = false;
    }
  };

  const refreshContract = useCallback(async () => {
    if (!contract?.id) return;
    try {
      const data = await getContract(contract.id);
      if (data) setContract(data);
    } catch {
      /* keep current snapshot on read failure */
    }
  }, [contract]);

  const handleFlagDispute = useCallback(async () => {
    if (!contract) return;
    setIsFlaggingDispute(true);
    try {
      await onChainFlagDispute();
      try {
        await flagDispute(contract.id);
      } catch {
        toast.error("On-chain dispute locked, but Firestore sync failed. Refresh to retry.");
      }
      await refreshContract();
      toast.success("Dispute flagged. Funds are now locked.");
      setIsDisputeFlowOpen(false);
    } catch {
      /* toast already shown by hook */
    } finally {
      setIsFlaggingDispute(false);
    }
  }, [contract, onChainFlagDispute, refreshContract]);

  const handleResolveDispute = useCallback(async () => {
    if (!contract || !resolveForm.releaseTo || !resolveForm.amount) return;
    setIsResolvingDispute(true);
    try {
      await onChainResolveDispute(publicKey!, resolveForm.releaseTo, Number(resolveForm.amount));
      setContract(prev => prev ? { ...prev, isDisputed: false, isClosed: true } : null);
      toast.success("Dispute resolved and funds released.");
      window.dispatchEvent(new CustomEvent('open-feedback-modal', { detail: { action: 'resolve_dispute' } }));
    } catch { /* toast already shown by hook */ }
    finally {
      setIsResolvingDispute(false);
    }
  }, [contract, resolveForm, onChainResolveDispute, publicKey]);

  const handleAcceptContract = async () => {
    if (!contract || acceptingContractRef.current) return;
    acceptingContractRef.current = true;
    setIsAccepting(true);
    try {
      await updateContract(contract.id, { isAccepted: true });
      if (publicKey) {
        await logTransactionEvent({
          contractId: contract.id,
          type: "contract_accepted",
          walletAddress: publicKey,
        });
      }
      setContract(prev => prev ? { ...prev, isAccepted: true } : null);
      toast.success("Contract terms accepted.");
      window.dispatchEvent(new CustomEvent('open-feedback-modal', { detail: { action: 'accept_contract' } }));
    } catch {
      toast.error("Failed to accept contract.");
    } finally {
      setIsAccepting(false);
      acceptingContractRef.current = false;
    }
  };

  const handleCancelContract = async () => {
    if (!contract || !publicKey || cancellingContractRef.current) return;
    if (!confirm("Are you sure you want to cancel this contract? This will refund the escrowed balance to your wallet.")) return;

    cancellingContractRef.current = true;
    setIsCancelling(true);
    try {
      toast.loading("Refunding escrowed balance to your wallet...", { id: "cancel" });
      await onChainCancelContract();
      
      toast.loading("Deleting contract record...", { id: "cancel" });
      const { deleteContract } = await import("@/lib/firebase/contracts");
      await deleteContract(contract.id);
      
      toast.success("Contract cancelled and funds refunded.", { id: "cancel" });
      router.push("/dashboard/contracts");
    } catch (err) {
      toast.error("Failed to cancel contract.", { id: "cancel" });
      setIsCancelling(false);
    } finally {
      cancellingContractRef.current = false;
    }
  };

  const handleShareInvite = () => {
    if (!contract || typeof window === 'undefined') return;
    const inviteLink = `${window.location.origin}/?invite=${contract.id}`;
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (publicKey) trackInviteSent(publicKey, contract.id);
    toast.success("Invite link copied to clipboard");
  };

  if (isFetching) {
    return (
      <div className="px-8 py-12 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-[20px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-64 w-full rounded-[20px]" />
          <Skeleton className="h-64 w-full rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="px-8 py-20 max-w-4xl mx-auto text-center flex flex-col items-center">
        <AlertCircle className="w-12 h-12 text-status-disputed mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-ink-primary mb-4">Contract Not Found</h2>
        <p className="text-ink-secondary mb-8 font-ui-label text-sm">The contract does not exist or you lack access.</p>
        <Link href="/dashboard" className="neopop-button-teal px-6 py-3 font-ui-label font-medium text-xs inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-4 md:p-8 lg:p-12 max-w-full lg:max-w-7xl mx-auto bg-bg-void min-h-screen text-ink-primary overflow-x-hidden">
        
        <Link href="/dashboard/contracts" className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-all font-ui-label text-xs uppercase tracking-wider font-medium w-fit border border-edge-neutral px-3.5 py-2 rounded-xl bg-bg-base hover:shadow-sm mb-8 md:mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>

        <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="font-headline-lg text-3xl lg:text-4xl font-bold tracking-tight mb-4">{contract.title}</h1>
            <p className="text-ink-secondary font-ui-label text-sm max-w-3xl leading-relaxed">{contract.description}</p>
          </div>
          {(isClient || isFreelancer) && (
            <button
              onClick={handleShareInvite}
              className="shrink-0 py-2.5 px-5 bg-bg-base border border-accent text-accent hover:bg-accent-glow font-ui-label font-medium text-xs rounded-xl transition-all hover:shadow-sm cursor-pointer"
            >
              {isCopied ? "Copied!" : "Share Invite Link"}
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Timeline on the left */}
          <div className="flex-1 space-y-8">
            <h2 className="font-ui-label text-sm uppercase tracking-wider text-ink-primary font-medium border-b border-edge-neutral pb-4">Milestones</h2>
            
            <div className="relative border-l border-ink-tertiary/30 ml-4 space-y-12 pb-8">
              {contract.milestones?.map((m, index) => {
                const isCompleted = m.status === "approved" || m.status === "released";
                const isActive = m.status === "pending" || m.status === "submitted";
                const isDisputed = contract.isDisputed;
                
                // Neon thread effect for active/completed
                const showNeonThread = isCompleted || (isActive && m.status === "submitted");

                return (
                  <div key={m.id} className="relative pl-8">
                    {/* Neon Thread filling the past border */}
                    {showNeonThread && (
                      <div className="absolute -left-[1px] -top-12 bottom-0 w-[2px] bg-accent shadow-[0_0_10px_rgba(0,255,200,0.8)] z-10" />
                    )}

                    {/* Timeline Node */}
                    <div className={`absolute -left-[6px] top-1.5 w-3 h-3 rounded-full z-20 ${
                      isCompleted ? 'bg-accent' : 
                      isActive ? 'bg-bg-base border-2 border-accent shadow-sm' : 
                      'bg-bg-base border-2 border-ink-tertiary'
                    }`} />

                    <div className="bg-bg-base border border-edge-neutral p-6 rounded-[20px] shadow-sm group hover:border-accent/40 transition-all duration-200">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                          <h3 className={`font-ui-label font-semibold text-base mb-1 ${isCompleted ? 'text-ink-tertiary line-through' : 'text-ink-primary'}`}>
                            {m.description}
                          </h3>
                          <p className="font-mono-data text-ink-secondary text-[10px] uppercase tracking-wider flex items-center gap-2 font-medium">
                            Status: <span className={isCompleted ? 'text-accent' : isActive ? 'text-ink-primary' : ''}>{m.status}</span>
                            {(() => {
                              const onChainStatus = escrowState?.milestones?.[index]?.status as any;
                              const onChainTag = (typeof onChainStatus === 'string' ? onChainStatus : onChainStatus?.tag || "").toLowerCase();
                              if (onChainTag === "approved" || onChainTag === "released") {
                                return (
                                  <span className="inline-flex items-center gap-1 bg-accent/10 border border-accent/30 text-accent px-2 py-0.5 text-[9px] rounded-full font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                    Verified On-Chain
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </p>

                          {m.deliverableUrl && (
                            <a href={m.deliverableUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-accent hover:underline font-ui-label text-xs tracking-wider font-semibold underline-offset-4">
                              View Deliverable
                            </a>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono-data font-semibold text-lg text-ink-primary">{Number(m.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-ink-tertiary">USDC</span></p>
                          <p className="text-[10px] font-mono-data text-ink-secondary uppercase tracking-wider mt-1 font-medium">
                            {isCompleted ? 'Released' : isDisputed ? 'Locked (Dispute)' : 'Locked'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Context Panel on the right */}
          <div className="w-full lg:w-[420px] space-y-8 shrink-0">
            
            {/* Contract Context */}
            <div className="bg-bg-base border border-edge-neutral shadow-sm p-6 rounded-[20px]">
              <h3 className="font-ui-label text-ink-primary font-semibold text-sm mb-6 pb-3 border-b border-edge-neutral">Contract Details</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="font-ui-label text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold mb-1">Total Value</p>
                  <p className="font-sans font-semibold text-2xl text-accent">{Number(contract.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC</p>
                </div>
                
                <div>
                  <p className="font-ui-label text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold mb-1">Client</p>
                  <p className="font-mono-data text-xs break-all text-ink-secondary leading-normal">{contract.clientWallet}</p>
                  {isClient && <span className="inline-block mt-2 bg-bg-interactive border border-edge-neutral text-ink-primary px-2 py-0.5 font-ui-label text-[10px] uppercase font-semibold rounded-md tracking-wider">You</span>}
                </div>
                
                <div>
                  <p className="font-ui-label text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold mb-1">Freelancer</p>
                  <p className="font-mono-data text-xs break-all text-ink-secondary leading-normal">{contract.freelancerWallet}</p>
                  {isFreelancer && <span className="inline-block mt-2 bg-bg-interactive border border-edge-neutral text-ink-primary px-2 py-0.5 font-ui-label text-[10px] uppercase font-semibold rounded-md tracking-wider">You</span>}
                </div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="bg-bg-base border border-edge-neutral shadow-sm p-6 rounded-[20px]">
              <h3 className="font-ui-label text-ink-primary font-semibold text-sm mb-6 pb-3 border-b border-edge-neutral">
                {activeMilestone ? `Action: Milestone ${activeMilestone.id}` : 'Actions'}
              </h3>
              
              {!isConnected ? (
                <p className="font-ui-label text-xs text-ink-secondary">Connect wallet to manage.</p>
              ) : contract.isDisputed ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-status-disputed border border-status-disputed/20 bg-status-disputed/5 p-4 rounded-xl">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span className="font-ui-label font-semibold uppercase tracking-wider text-xs">Dispute Active</span>
                  </div>
                  {isClient ? (
                    <div className="space-y-4">
                      <p className="text-xs font-ui-label text-ink-secondary">Resolve dispute by specifying recipient and amount.</p>
                      <input
                        type="text"
                        value={resolveForm.releaseTo}
                        onChange={(e) => setResolveForm(prev => ({ ...prev, releaseTo: e.target.value }))}
                        placeholder="Release To (G...)"
                        className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-mono-data text-xs transition-all"
                      />
                      <input
                        type="number"
                        value={resolveForm.amount}
                        onChange={(e) => setResolveForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="Amount (USDC)"
                        className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-mono-data text-xs transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleResolveDispute}
                        disabled={isResolvingDispute || !resolveForm.releaseTo || !resolveForm.amount}
                        className="w-full py-3.5 bg-status-disputed text-white font-ui-label font-medium rounded-xl text-xs flex justify-center items-center gap-2 hover:bg-opacity-90 disabled:opacity-50 mt-4 cursor-pointer"
                      >
                        {isResolvingDispute ? <Loader2 className="w-5 h-5 animate-spin" /> : "Resolve Dispute"}
                      </button>
                    </div>
                  ) : isFreelancer ? (
                    <p className="text-xs font-ui-label text-ink-secondary">Awaiting resolution from the client.</p>
                  ) : null}
                </div>
              ) : !contractIsAccepted ? (
                isClient ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 border border-dashed border-status-disputed/30 rounded-xl bg-status-disputed/5">
                      <p className="font-ui-label text-xs text-status-disputed uppercase tracking-wider mb-1 font-semibold">Awaiting Acceptance</p>
                      <p className="font-mono-data text-[10px] text-ink-secondary leading-normal">Freelancer has not accepted this contract yet.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelContract}
                      disabled={isCancelling}
                      className="w-full py-3 bg-status-disputed/10 text-status-disputed border border-status-disputed/35 rounded-xl font-ui-label font-medium text-xs flex justify-center items-center gap-2 hover:bg-status-disputed/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cancel Contract & Refund"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-6 border border-dashed border-accent/30 rounded-xl bg-accent-glow">
                      <p className="font-ui-label text-xs text-accent uppercase tracking-wider mb-1 font-semibold">New Contract Offer</p>
                      <p className="font-mono-data text-[10px] text-ink-secondary leading-normal">Review the milestones and accept to begin.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAcceptContract}
                      disabled={isAccepting}
                      className="neopop-button-teal w-full py-3.5 font-ui-label font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isAccepting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Accept Contract"}
                    </button>
                  </div>
                )
              ) : isClient ? (
                <div className="space-y-6">
                  {!contract.contractAddress ? (
                    <div className="space-y-4">
                      <div className="text-center p-6 border border-dashed border-accent/30 rounded-xl bg-accent-glow">
                        <p className="font-ui-label text-xs text-accent uppercase tracking-wider mb-1 font-semibold">Contract Accepted</p>
                        <p className="font-mono-data text-[10px] text-ink-secondary leading-normal">Ready to escrow funds on the Stellar network.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleFundEscrow}
                        disabled={isEscrowLoading}
                        className="neopop-button-teal w-full py-3.5 font-ui-label font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isEscrowLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Fund Contract (Escrow)"}
                      </button>
                    </div>
                  ) : currentStatus === "pending" ? (
                    <div className="text-center p-6 border border-dashed border-edge-neutral rounded-xl bg-bg-void/50">
                      <p className="font-ui-label text-xs text-ink-secondary uppercase tracking-wider font-semibold">Awaiting Submission</p>
                    </div>
                  ) : currentStatus === "submitted" ? (
                    <>
                      <div className="p-4 bg-accent-glow border border-accent/20 rounded-xl mb-6 flex items-center justify-between">
                        <p className="font-ui-label text-xs text-accent font-semibold uppercase tracking-wider">Work Submitted</p>
                      </div>
                      
                      <button type="button"
                        onClick={handleApproveMilestone}
                        disabled={isEscrowLoading}
                        className="neopop-button-teal w-full py-3.5 font-ui-label font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isEscrowLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Approve & Release Funds"}
                      </button>

                      {isDisputeFlowOpen ? (
                        <div className="mt-6 p-4 border border-status-disputed/20 bg-status-disputed/5 rounded-xl space-y-4">
                          <p className="font-ui-label text-sm font-semibold text-status-disputed uppercase tracking-wider">Confirm Dispute</p>
                          <p className="text-[10px] font-mono-data text-ink-secondary leading-normal">This will lock all funds until resolved.</p>
                          <div className="flex gap-4 pt-2">
                            <button
                               type="button"
                               onClick={handleFlagDispute}
                               disabled={isFlaggingDispute}
                               className="flex-1 py-2 bg-status-disputed text-white font-ui-label rounded-xl font-semibold text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                            >
                              {isFlaggingDispute ? "Processing..." : "Flag"}
                            </button>
                            <button
                               type="button"
                               onClick={() => setIsDisputeFlowOpen(false)}
                               className="flex-1 py-2 border border-edge-neutral text-ink-primary font-ui-label rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-bg-interactive cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsDisputeFlowOpen(true)}
                          className="w-full mt-4 py-3 border border-status-disputed/30 rounded-xl text-status-disputed font-ui-label font-medium text-xs hover:bg-status-disputed/5 transition-all cursor-pointer"
                        >
                          Request Revision / Dispute
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-6 border border-dashed border-accent/30 rounded-xl bg-accent-glow">
                      <p className="font-ui-label text-xs text-accent font-semibold uppercase tracking-wider">Completed</p>
                    </div>
                  )}
                  {contract.isClosed && (
                    <ContractReviewWidget 
                      contractId={contract.id} 
                      recipientWallet={contract.freelancerWallet} 
                    />
                  )}
                </div>
              ) : isFreelancer ? (
                <div className="space-y-6">
                  {!contract.contractAddress ? (
                    <div className="text-center p-6 border border-dashed border-edge-neutral rounded-xl bg-bg-void/50">
                      <p className="font-ui-label text-xs text-ink-secondary uppercase tracking-wider font-semibold mb-1">Awaiting Funding</p>
                      <p className="font-mono-data text-[10px] text-ink-tertiary font-medium">Waiting for the client to fund the escrow contract.</p>
                    </div>
                  ) : currentStatus === "pending" ? (
                    <form onSubmit={handleSubmitWork} className="space-y-4">
                      <input
                        type="url"
                        required
                        value={deliverableUrl}
                        onChange={(e) => setDeliverableUrl(e.target.value)}
                        placeholder="Deliverable URL (https://...)"
                        className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-mono-data text-xs transition-all"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingWork || !deliverableUrl}
                        className="neopop-button-teal w-full py-3.5 font-ui-label font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmittingWork ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Work"}
                      </button>
                    </form>
                  ) : currentStatus === "submitted" ? (
                    <div className="text-center p-6 border border-dashed border-edge-neutral rounded-xl bg-bg-void/50">
                      <p className="font-ui-label text-xs text-ink-secondary uppercase tracking-wider font-semibold mb-1">In Review</p>
                      <p className="font-mono-data text-[10px] text-ink-tertiary font-medium">Awaiting client approval</p>
                    </div>
                  ) : (
                    <div className="text-center p-6 border border-dashed border-accent/35 rounded-xl bg-accent-glow">
                      <p className="font-ui-label text-xs text-accent font-semibold uppercase tracking-wider mb-1">Completed</p>
                      <p className="font-mono-data text-[10px] text-accent mt-1 font-semibold uppercase">Funds Released</p>
                    </div>
                  )}
                  {contract.isClosed && (
                    <ContractReviewWidget 
                      contractId={contract.id} 
                      recipientWallet={contract.clientWallet} 
                    />
                  )}
                </div>
              ) : (
                <p className="font-ui-label text-sm text-ink-secondary">Guest View (No actions available)</p>
              )}
            </div>

            {/* Activity Feed */}
            <div className="mt-8">
              <ActivityFeed contractId={contract.id} />
            </div>

            {/* Chat Widget */}
            <div className="mt-8">
              <ChatWidget contractId={contract.id} />
            </div>

          </div>
        </div>

      </div>
    </ErrorBoundary>
  );
}