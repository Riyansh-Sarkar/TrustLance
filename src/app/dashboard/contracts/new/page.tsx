"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { createContract } from "@/lib/firebase/contracts";
import { updateJobStatus, updateApplicationStatus } from "@/lib/firebase/jobs";
import { useWallet } from "@/hooks/useWallet";
import { useEscrow } from "@/hooks/useEscrow";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { m, AnimatePresence } from 'framer-motion';
import type { NewContractFormData } from "@/types";
import Link from "next/link";

function NewContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  const { fundContract } = useEscrow();

  const queryJobId = searchParams?.get("jobId") || "";
  const queryAppId = searchParams?.get("applicationId") || "";
  const queryFreelancer = searchParams?.get("freelancerAddress") || "";
  const queryTitle = searchParams?.get("title") || "";
  const queryDescription = searchParams?.get("description") || "";
  const queryAmount = searchParams?.get("amount") || "";

  const [formData, setFormData] = useState<NewContractFormData>(() => {
    const isInvalid = queryFreelancer && (!queryFreelancer.startsWith("G") || queryFreelancer.length !== 56);
    return {
      title: queryTitle,
      description: queryDescription,
      freelancerAddress: isInvalid ? "" : queryFreelancer,
      jobId: queryJobId,
      applicationId: queryAppId,
      milestones: [{ description: queryDescription || "", amount: queryAmount || "", deliverableUrl: "" }],
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    return queryFreelancer && (!queryFreelancer.startsWith("G") || queryFreelancer.length !== 56)
      ? "Invalid freelancer address in URL parameters."
      : null;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey) {
      setError("You must be logged in to create a contract");
      return;
    }

    if (!formData.freelancerAddress.startsWith("G") || formData.freelancerAddress.length !== 56) {
      setError("Invalid counterparty address. Must be a valid Stellar public key starting with 'G'.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const milestoneAmounts = formData.milestones.map(m => parseFloat(m.amount || "0"));
      const milestoneDescriptions = formData.milestones.map(m => m.description);
      const totalAmount = milestoneAmounts.reduce((a, b) => a + b, 0);

      // Dynamically import generateContractId so it works on client side
      const { generateContractId } = await import("@/lib/firebase/contracts");
      const projectId = generateContractId();

      const result = await fundContract(
        projectId,
        formData.freelancerAddress,
        milestoneAmounts,
        milestoneDescriptions
      );

      const txHash = (result as { hash?: string })?.hash || "pending";

      await createContract({
        clientWallet: publicKey,
        freelancerWallet: formData.freelancerAddress,
        title: formData.title,
        description: formData.description,
        totalAmount,
        contractAddress: txHash,
        isDisputed: false,
        isClosed: false,
        isAccepted: false,
        ...(formData.jobId ? { jobId: formData.jobId } : {}),
        ...(formData.applicationId ? { applicationId: formData.applicationId } : {}),
        milestones: formData.milestones.map((m, idx) => {
          const milestone: any = {
            id: idx + 1,
            description: m.description || `Milestone ${idx + 1}`,
            amount: parseFloat(m.amount || "0"),
            status: "pending",
          };
          if (m.deliverableUrl) milestone.deliverableUrl = m.deliverableUrl;
          return milestone;
        })
      }, projectId);

      // Update Job and Application statuses if they exist
      if (formData.jobId && formData.applicationId) {
        await updateJobStatus(formData.jobId, "closed");
        await updateApplicationStatus(formData.applicationId, "accepted");
      }

      window.dispatchEvent(new CustomEvent('open-feedback-modal', { detail: { action: 'create_contract' } }));
      router.push("/dashboard/contracts");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create contract";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMilestoneChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newMilestones = [...prev.milestones];
      newMilestones[index] = { ...newMilestones[index], [field]: value };
      return { ...prev, milestones: newMilestones };
    });
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { description: "", amount: "", deliverableUrl: "" }]
    }));
  };

  const removeMilestone = (index: number) => {
    if (formData.milestones.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const totalCalculated = formData.milestones.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-bg-void text-ink-primary">
      {/* Left Pane: Active Form */}
      <div className="flex-1 p-8 lg:p-16 pb-24 lg:pb-32 flex flex-col max-w-2xl mx-auto lg:mx-0 w-full">
        <Link href="/dashboard" className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-all font-ui-label text-xs uppercase tracking-wider font-medium w-fit border border-edge-neutral px-3.5 py-2 rounded-xl bg-bg-base hover:shadow-sm mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <h1 className="font-headline-lg text-3xl lg:text-4xl font-bold tracking-tight mb-2">Create Contract</h1>
        <p className="text-ink-secondary mb-12 font-ui-label text-sm">Configure the parameters for your escrowed agreement.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Field: Freelancer Address */}
          <div className="space-y-2">
            <label htmlFor="freelancerAddress" className="block font-ui-label text-xs uppercase tracking-wider font-semibold text-ink-secondary">Counterparty Address</label>
            <input
              id="freelancerAddress"
              required
              name="freelancerAddress"
              value={formData.freelancerAddress}
              onChange={handleChange}
              className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-mono-data text-sm transition-all text-ink-primary placeholder:text-ink-tertiary"
              placeholder="G..."
            />
          </div>

          {/* Field: Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block font-ui-label text-xs uppercase tracking-wider font-semibold text-ink-secondary">Contract Title</label>
            <input
              id="title"
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-ui-label text-sm transition-all text-ink-primary placeholder:text-ink-tertiary"
              placeholder="e.g. Q4 Website Development"
            />
          </div>

          {/* Field: Scope */}
          <div className="space-y-2">
            <label htmlFor="description" className="block font-ui-label text-xs uppercase tracking-wider font-semibold text-ink-secondary">Scope of Work</label>
            <textarea
              id="description"
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-ui-label text-sm transition-all placeholder:text-ink-tertiary resize-none text-ink-primary leading-relaxed"
              placeholder="Briefly outline deliverables..."
            />
          </div>

          {/* Milestones Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-edge-neutral pb-4">
              <label className="block font-ui-label text-xs uppercase tracking-wider font-semibold text-ink-secondary">Milestones</label>
              <button
                type="button"
                onClick={addMilestone}
                className="text-accent hover:text-accent/80 font-ui-label text-xs uppercase tracking-wider font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Milestone
              </button>
            </div>

            <div className="space-y-6">
              {formData.milestones.map((milestone, idx) => (
                <div key={idx} className="relative p-6 border border-edge-neutral rounded-[20px] bg-bg-void/50 hover:border-accent hover:shadow-sm transition-all duration-200">
                  {formData.milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="absolute top-4 right-4 text-ink-tertiary hover:text-status-disputed transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="mb-4">
                    <span className="font-mono-data text-[10px] uppercase tracking-wider text-ink-tertiary font-semibold">Milestone {idx + 1}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block font-ui-label text-[10px] uppercase tracking-wider font-semibold text-ink-secondary">Deliverable Description</label>
                      <input
                        required
                        value={milestone.description}
                        onChange={(e) => handleMilestoneChange(idx, 'description', e.target.value)}
                        className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-ui-label text-sm transition-all text-ink-primary placeholder:text-ink-tertiary"
                        placeholder="e.g. Design Mockups"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block font-ui-label text-[10px] uppercase tracking-wider font-semibold text-ink-secondary">Value (USDC)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3.5 font-mono-data text-ink-tertiary text-sm">$</span>
                          <input
                            required
                            type="number"
                            step="0.01"
                            min="0.1"
                            value={milestone.amount}
                            onChange={(e) => handleMilestoneChange(idx, 'amount', e.target.value)}
                            className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl py-3 pl-8 pr-4 font-mono-data text-sm font-semibold tabular-nums transition-all placeholder:text-ink-tertiary text-ink-primary"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block font-ui-label text-[10px] uppercase tracking-wider font-semibold text-ink-secondary">Deliverable URL (Optional)</label>
                        <input
                          type="url"
                          value={milestone.deliverableUrl || ""}
                          onChange={(e) => handleMilestoneChange(idx, 'deliverableUrl', e.target.value)}
                          className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-mono-data text-xs transition-all text-ink-primary placeholder:text-ink-tertiary"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-status-disputed/10 border border-status-disputed/20 text-status-disputed font-ui-label text-sm font-medium rounded-xl"
              >
                {error}
              </m.div>
            )}
          </AnimatePresence>

          <div className="pt-6 flex items-center justify-end">
            <button
              type="submit"
              disabled={isLoading || totalCalculated <= 0 || !formData.freelancerAddress || formData.milestones.some(m => !m.description || !m.amount)}
              className="neopop-button-teal px-8 py-3.5 font-ui-label font-medium text-xs flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :
               <>Execute Contract <ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        </form>
      </div>

      {/* Right Pane: Receipt Preview */}
      <div className="lg:w-[480px] bg-bg-void border-t lg:border-t-0 lg:border-l border-edge-neutral relative">
        <div className="p-8 lg:p-12 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center overflow-hidden">
        
        <div className="w-full max-w-[380px] mx-auto bg-bg-base border border-edge-neutral p-8 rounded-[20px] shadow-lg relative">
          {/* Top Cutout decoration for receipt */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-bg-void rounded-full border-b border-edge-neutral/20" />
            ))}
          </div>

          <div className="text-center mb-8 pt-4">
            <h3 className="font-ui-label text-ink-primary font-semibold tracking-wider uppercase text-sm">Escrow Receipt</h3>
            <p className="font-mono-data text-ink-tertiary text-[9px] uppercase mt-1">TrustLance Protocol</p>
          </div>

          <div className="space-y-6">
            <div className="border-b border-dashed border-edge-neutral pb-6">
              <p className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-wider mb-1 font-medium">Contract Title</p>
              <p className="font-ui-label text-ink-primary font-semibold text-base break-words leading-relaxed">
                {formData.title || "Untitled Contract"}
              </p>
            </div>

            <div className="border-b border-dashed border-edge-neutral pb-6">
              <p className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-wider mb-1 font-medium">Counterparty</p>
              <p className="font-mono-data text-ink-secondary text-[11px] break-all leading-relaxed">
                {formData.freelancerAddress || "--------------------------------------------------------"}
              </p>
            </div>

            <div className="border-b border-dashed border-edge-neutral pb-6">
              <p className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-wider mb-1 font-medium">Scope</p>
              <p className="font-ui-label text-ink-secondary text-xs break-words line-clamp-3 leading-relaxed">
                {formData.description || "..."}
              </p>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between">
                <p className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-wider font-medium">Total Value</p>
                <p className="font-sans font-semibold text-accent text-2xl tabular-nums tracking-tight">
                  {totalCalculated > 0 ? totalCalculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </p>
              </div>
              <div className="flex justify-end mt-1">
                <span className="font-mono-data text-ink-tertiary text-[10px] uppercase tracking-wider">USDC</span>
              </div>
            </div>
          </div>

          {/* Bottom Cutout decoration for receipt */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-bg-void rounded-full border-t border-edge-neutral/20" />
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-ink-secondary" /></div>}>
        <NewContractForm />
      </Suspense>
    </ErrorBoundary>
  );
}