"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ArrowRight, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { getJob, getJobApplications, applyToJob, deleteJob } from "@/lib/firebase/jobs";
import { useWallet } from "@/hooks/useWallet";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import type { Job, JobApplication } from "@/types";
import { m, AnimatePresence } from "framer-motion";

function formatTimeAgo(dateInput: string | Date) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours`;
  return `${Math.floor(diffInSeconds / 86400)} days`;
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  const router = useRouter();
  const { publicKey } = useWallet();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application form state
  const [proposal, setProposal] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const jobData = await getJob(jobId);
        setJob(jobData);
        if (jobData) {
          const apps = await getJobApplications(jobId);
          setApplications(apps);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [jobId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      setError("You must be logged in to apply.");
      return;
    }
    setIsApplying(true);
    setError(null);
    try {
      await applyToJob({
        jobId,
        freelancerWallet: publicKey,
        proposal,
        bidAmount,
      });
      // Reload applications
      const apps = await getJobApplications(jobId);
      setApplications(apps);
      setProposal("");
      setProposal("");
      setBidAmount("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setIsApplying(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      setIsLoading(true);
      await deleteJob(jobId);
      router.push("/dashboard/jobs");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-ink-secondary" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-4 bg-status-disputed/10 border border-status-disputed/20 text-status-disputed font-ui-label text-sm font-bold uppercase tracking-wider">
          {error || "Job not found"}
        </div>
        <Link href="/dashboard/jobs" className="mt-8 inline-flex items-center gap-2 text-ink-tertiary hover:text-ink-primary transition-colors font-ui-label text-sm font-bold uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
      </div>
    );
  }

  const isOwner = publicKey === job.clientId;
  const hasApplied = applications.some(a => a.freelancerWallet === publicKey);
  const myApplication = applications.find(a => a.freelancerWallet === publicKey);

  return (
    <ErrorBoundary>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-bg-void text-ink-primary">
        
        {/* Left Pane: Job Details & Application Form */}
        <div className="flex-1 p-8 lg:p-16 pb-24 border-r border-edge-neutral">
          <div className="flex items-center justify-between mb-12">
            <Link href="/dashboard/jobs" className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-all font-ui-label text-xs uppercase tracking-wider font-medium w-fit border border-edge-neutral px-3.5 py-2 rounded-xl bg-bg-base hover:shadow-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Jobs
            </Link>
            
            {isOwner && job.status === "open" && (
              <button 
                onClick={handleDeleteJob}
                className="flex items-center gap-2 text-status-disputed hover:bg-status-disputed/5 border border-edge-neutral rounded-xl px-4 py-2 transition-all font-ui-label text-xs uppercase tracking-wider font-medium hover:shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Job
              </button>
            )}
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className={`px-2.5 py-0.5 rounded-md font-mono-data text-[10px] uppercase tracking-wider ${job.status === 'open' ? 'bg-status-released/10 text-status-released border border-status-released/20' : 'bg-status-disputed/10 text-status-disputed border border-status-disputed/20'}`}>
                {job.status}
              </span>
              <span className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-wider font-medium">
                Posted {formatTimeAgo(job.createdAt)} ago
              </span>
            </div>
            <h1 className="font-headline-lg text-3xl lg:text-4xl font-bold tracking-tight mb-6">{job.title}</h1>
            <p className="font-ui-label text-sm text-ink-secondary whitespace-pre-wrap leading-relaxed">{job.description}</p>
            
            <div className="mt-8 p-6 bg-accent-glow border border-accent/20 rounded-[20px] inline-block shadow-sm">
              <p className="font-mono-data text-[10px] uppercase tracking-wider text-ink-tertiary mb-1 font-medium">Estimated Budget</p>
              <p className="font-sans text-3xl font-semibold text-accent">USDC {job.budget}</p>
            </div>
          </div>

          {!isOwner && job.status === "open" && !hasApplied && (
            <div className="border-t border-edge-neutral pt-12">
              <h2 className="font-headline-lg text-2xl font-bold mb-6">Submit Proposal</h2>
              <form onSubmit={handleApply} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <label htmlFor="proposal" className="block font-ui-label text-xs uppercase tracking-wider font-semibold text-ink-secondary">Cover Letter / Proposal</label>
                  <textarea
                    id="proposal"
                    required
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    rows={4}
                    className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-ui-label text-sm transition-all placeholder:text-ink-tertiary resize-none"
                    placeholder="Why are you a good fit?"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="bid" className="block font-ui-label text-xs uppercase tracking-wider font-semibold text-ink-secondary">Your Bid (USDC)</label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3.5 top-3.5 font-mono-data text-ink-tertiary text-sm">$</span>
                    <input
                      id="bid"
                      required
                      type="number"
                      step="0.01"
                      min="1"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl py-3 pl-8 pr-4 font-mono-data text-sm font-semibold tabular-nums transition-all placeholder:text-ink-tertiary"
                      placeholder={job.budget.toString()}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isApplying || !proposal || !bidAmount}
                  className="neopop-button-teal px-8 py-4 font-ui-label font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
                </button>
              </form>
            </div>
          )}

          {!isOwner && hasApplied && myApplication && (
            <div className="border-t border-edge-neutral pt-12">
              <div className="p-6 bg-status-released/5 border border-status-released/20 rounded-[20px] shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-status-released">
                  <CheckCircle2 className="w-6 h-6" />
                  <h3 className="font-ui-label font-semibold uppercase tracking-wider text-xs">Application Submitted</h3>
                </div>
                <p className="font-ui-label text-xs text-ink-secondary mb-4 leading-relaxed">You have successfully applied to this job. The client will review your proposal.</p>
                <div className="space-y-2">
                  <p className="font-mono-data text-xs"><span className="text-ink-tertiary uppercase tracking-wider text-[10px] mr-4 font-medium">Status</span> <span className={`px-2 py-0.5 rounded-md ${myApplication.status === 'accepted' ? 'text-status-released bg-status-released/5' : myApplication.status === 'rejected' ? 'text-status-disputed bg-status-disputed/5' : 'text-accent bg-accent-glow'}`}>{myApplication.status.toUpperCase()}</span></p>
                  <p className="font-mono-data text-xs"><span className="text-ink-tertiary uppercase tracking-wider text-[10px] mr-4 font-medium">Bid</span> {myApplication.bidAmount} USDC</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Applications (Only for owner) */}
        {isOwner && (
          <div className="lg:w-[460px] bg-bg-void border-l border-edge-neutral relative p-8 lg:p-12 overflow-y-auto max-h-screen">
            <h2 className="font-ui-label text-xl font-bold mb-8 text-ink-primary">Applications ({applications.length})</h2>
            
            {applications.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-edge-neutral rounded-[20px] bg-bg-base">
                <p className="font-ui-label text-ink-secondary text-xs">No applications yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {applications.map(app => (
                  <div key={app.id} className="p-6 border border-edge-neutral bg-bg-base rounded-[20px] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-data text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold truncate w-32">
                        {app.freelancerWallet}
                      </span>
                      <span className="font-mono-data text-sm font-semibold text-accent">
                        USDC {app.bidAmount}
                      </span>
                    </div>
                    
                    <p className="font-ui-label text-xs text-ink-secondary leading-relaxed line-clamp-4">
                      {app.proposal}
                    </p>

                    {job.status === "open" && app.status === "pending" ? (
                      <Link
                        href={`/dashboard/contracts/new?freelancerAddress=${app.freelancerWallet}&jobId=${job.id}&applicationId=${app.id}&title=${encodeURIComponent(job.title)}&description=${encodeURIComponent(job.description)}&amount=${app.bidAmount}`}
                        className="neopop-button-teal w-full py-3 font-ui-label font-medium text-xs flex items-center justify-center gap-2"
                      >
                        Accept & Hire <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <div className={`text-center py-2.5 rounded-xl font-ui-label text-xs uppercase tracking-wider font-semibold ${app.status === 'accepted' ? 'text-status-released bg-status-released/5 border border-status-released/10' : 'text-ink-tertiary bg-bg-interactive border border-edge-neutral'}`}>
                        {app.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
