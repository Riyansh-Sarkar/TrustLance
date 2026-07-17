'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ShieldCheck, ArrowRight, X } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

function InviteReceiverContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteId = searchParams?.get('invite')
  const { isConnected } = useWallet()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (inviteId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true)
    }
  }, [inviteId])

  const handleClose = () => {
    setIsOpen(false)
    // Remove query param without reloading
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }

  const handleAccept = () => {
    if (isConnected) {
      router.push(`/dashboard/contracts/${inviteId}`)
    } else {
      router.push(`/auth?redirect=/dashboard/contracts/${inviteId}`)
    }
    handleClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-void/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-bg-base border-2 border-accent shadow-neopop p-8 relative"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-ink-tertiary hover:text-ink-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-accent/10 border-2 border-accent flex items-center justify-center rounded-full">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              
              <div>
                <h2 className="font-headline-lg text-2xl font-bold uppercase tracking-widest text-ink-primary mb-2">
                  You&apos;ve been invited!
                </h2>
                <p className="font-mono-data text-ink-secondary text-sm">
                  Someone invited you to collaborate on a smart contract via FreelancePay.
                </p>
              </div>

              <div className="w-full bg-bg-void border border-edge-neutral p-4 text-left space-y-3">
                <p className="font-ui-label text-xs uppercase tracking-widest text-ink-tertiary font-bold mb-2 border-b border-edge-neutral pb-2">How it works</p>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <p className="font-mono-data text-xs text-ink-secondary">Connect your Stellar wallet to view the contract details.</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <p className="font-mono-data text-xs text-ink-secondary">Review the milestones, deliverables, and payment amounts.</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <p className="font-mono-data text-xs text-ink-secondary">Accept the contract to lock the terms on-chain.</p>
                </div>
              </div>

              <button
                onClick={handleAccept}
                className="w-full py-4 bg-accent text-bg-base font-headline-lg font-bold uppercase tracking-widest text-lg hover:-translate-y-1 shadow-[4px_4px_0px_var(--color-ink-primary)] transition-all flex items-center justify-center gap-2"
              >
                View Contract <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function InviteReceiver() {
  return (
    <Suspense fallback={null}>
      <InviteReceiverContent />
    </Suspense>
  )
}
