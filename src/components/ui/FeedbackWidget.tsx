"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { submitFeedback } from "@/lib/firebase/growth";
import { useWallet } from "@/hooks/useWallet";
import { useAnalytics } from "@/hooks/useAnalytics";
import { CheckCircle2, Star, MessageSquare, X, ExternalLink } from "lucide-react";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [completedAction, setCompletedAction] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { publicKey } = useWallet();
  const { trackFeedbackShown, trackFeedbackSubmitted } = useAnalytics();

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent<{ action?: string }>) => {
      setIsOpen(true);
      setCompletedAction(event.detail?.action || null);
      const currentPublicKey = publicKey || (typeof window !== "undefined" ? localStorage.getItem("fp_wallet_address") : null);
      if (currentPublicKey) {
        trackFeedbackShown(currentPublicKey);
      }
    };

    window.addEventListener('open-feedback-modal', handleOpenModal as EventListener);
    return () => {
      window.removeEventListener('open-feedback-modal', handleOpenModal as EventListener);
    };
  }, [publicKey, trackFeedbackShown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentPublicKey = publicKey || (typeof window !== "undefined" ? localStorage.getItem("fp_wallet_address") : null);
    if (!currentPublicKey) {
      alert("Please connect your wallet first");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await submitFeedback({
        walletAddress: currentPublicKey,
        rating,
        confusionPoint: comment, // using comment as confusionPoint/free-text
        completedAction: completedAction ? [completedAction] : [],
      });
      
      trackFeedbackSubmitted(currentPublicKey, rating);
      
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setRating(0);
        setComment("");
        setCompletedAction(null);
      }, 5000); // Wait 5 seconds so they have time to click the Google Form link
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    const currentPublicKey = publicKey || (typeof window !== "undefined" ? localStorage.getItem("fp_wallet_address") : null);
    if (newState && currentPublicKey) {
      trackFeedbackShown(currentPublicKey);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 bg-bg-base border-2 border-edge-neutral shadow-neopop p-6 mb-4"
          >
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-2" />
                <h3 className="font-headline-sm font-bold text-ink-primary uppercase tracking-widest">Thank you!</h3>
                <p className="text-ink-secondary text-sm mt-1 font-mono-data mb-4">
                  Your feedback helps us improve.
                </p>
                <a 
                  href="https://forms.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-accent hover:text-ink-primary transition-colors mt-4 border-2 border-accent hover:border-ink-primary p-2"
                >
                  Fill full Form <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="font-ui-label font-bold text-ink-primary mb-4 uppercase tracking-widest text-sm">
                  Rate your experience
                </h3>
                <div className="flex gap-2 mb-6 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`transition-colors ${
                        star <= rating ? "text-accent" : "text-edge-neutral hover:text-ink-tertiary"
                      }`}
                    >
                      <Star className="w-8 h-8" fill={star <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What could be improved? (Optional)"
                  className="w-full bg-transparent p-3 border-2 border-edge-neutral text-ink-primary text-sm mb-4 focus:outline-none focus:border-accent transition-colors min-h-[80px] resize-none font-ui-label placeholder:text-ink-tertiary"
                />
                <div className="flex justify-end gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-ink-primary transition-colors border-2 border-transparent hover:border-edge-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="bg-ink-primary text-bg-base px-6 py-2 border-2 border-ink-primary text-xs font-bold uppercase tracking-widest hover:bg-ink-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? "Sending..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </m.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleToggle}
        className="bg-ink-primary text-bg-base border-2 border-ink-primary w-14 h-14 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
        aria-label="Feedback"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
