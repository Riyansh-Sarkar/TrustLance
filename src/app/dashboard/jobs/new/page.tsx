"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { createJob } from "@/lib/firebase/jobs";
import { useWallet } from "@/hooks/useWallet";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { m, AnimatePresence } from "framer-motion";

export default function NewJobPage() {
  const router = useRouter();
  const { publicKey } = useWallet();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      setError("You must be logged in to post a job.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await createJob({
        clientId: publicKey,
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        status: "open",
      });
      router.push("/dashboard/jobs");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <ErrorBoundary>
      <div className="max-w-3xl mx-auto p-8 lg:p-16">
        <Link href="/dashboard/jobs" className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-all font-ui-label text-xs uppercase tracking-wider font-medium w-fit border border-edge-neutral px-3.5 py-2 rounded-xl bg-bg-base hover:shadow-sm mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        
        <h1 className="font-headline-lg text-3xl font-bold tracking-tight mb-2 text-ink-primary">Post a Job</h1>
        <p className="text-ink-secondary mb-12 font-ui-label text-sm">Describe your project and set an estimated budget to attract top talent.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Field: Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block font-ui-label text-xs uppercase tracking-wider font-semibold text-ink-secondary">Job Title</label>
            <input
              id="title"
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-ui-label text-sm transition-all placeholder:text-ink-tertiary text-ink-primary"
              placeholder="e.g. Fullstack Web3 Developer Needed"
            />
          </div>

          {/* Field: Scope */}
          <div className="space-y-2">
            <label htmlFor="description" className="block font-ui-label text-xs uppercase tracking-wider font-semibold text-ink-secondary">Project Description</label>
            <textarea
              id="description"
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl p-3 font-ui-label text-sm transition-all placeholder:text-ink-tertiary resize-none text-ink-primary leading-relaxed"
              placeholder="Describe the deliverables, timeline, and requirements..."
            />
          </div>

          {/* Field: Budget */}
          <div className="space-y-2">
            <label htmlFor="budget" className="block font-ui-label text-xs uppercase tracking-wider font-semibold text-ink-secondary">Estimated Budget (USDC)</label>
            <div className="relative max-w-sm">
              <span className="absolute left-3.5 top-3.5 font-mono-data text-ink-tertiary text-sm">$</span>
              <input
                id="budget"
                required
                name="budget"
                type="number"
                step="0.01"
                min="1"
                value={formData.budget}
                onChange={handleChange}
                className="w-full bg-bg-base border border-edge-neutral focus:border-accent focus:ring-2 focus:ring-accent-glow rounded-xl py-3 pl-8 pr-4 font-mono-data text-sm font-semibold tabular-nums transition-all placeholder:text-ink-tertiary text-ink-primary"
                placeholder="0.00"
              />
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

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading || !formData.title || !formData.description || !formData.budget}
              className="neopop-button-teal w-full sm:w-auto px-10 py-3.5 font-ui-label font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :
               <>Post Job <ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}
