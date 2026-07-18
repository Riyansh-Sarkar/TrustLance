"use client";

import React, { useState } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { saveFeedback } from "@/lib/firebase/contracts";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";

interface ContractReviewWidgetProps {
  contractId: string;
}

export function ContractReviewWidget({ contractId }: ContractReviewWidgetProps) {
  const { publicKey } = useWallet();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await saveFeedback(contractId, {
        rating,
        comment,
        walletAddress: publicKey,
      });
      setSubmitted(true);
      toast.success("Review submitted successfully");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-accent/10 border-2 border-accent/30 p-6 text-center mt-8">
        <p className="font-ui-label text-sm text-accent uppercase tracking-widest font-bold">Feedback Submitted</p>
        <p className="text-xs text-ink-secondary font-mono-data mt-2">Thank you for leaving a review.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-base border border-edge-neutral shadow-neopop p-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-5 h-5 text-ink-primary" />
        <h3 className="font-ui-label text-sm uppercase tracking-widest font-bold text-ink-primary">Leave a Review</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="font-ui-label text-[10px] text-ink-tertiary uppercase tracking-widest block mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`transition-colors p-1 ${
                  star <= rating ? "text-accent" : "text-edge-neutral hover:text-ink-tertiary"
                }`}
              >
                <Star className="w-8 h-8" fill={star <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-ui-label text-[10px] text-ink-tertiary uppercase tracking-widest block mb-2">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was your experience?"
            className="w-full bg-transparent border-2 border-edge-neutral focus:border-accent outline-none p-4 font-ui-label text-sm transition-colors min-h-[100px] resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="neopop-button-teal w-full py-4 font-ui-label font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
