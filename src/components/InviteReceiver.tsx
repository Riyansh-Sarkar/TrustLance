'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { m, AnimatePresence } from 'framer-motion'
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
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-bg-base border-2 border-accent shadow-neopop p-8 relative"
          >
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 text-ink-tertiary hover:text-ink-primary hover:bg-bg-interactive rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-accent-glow border border-accent/30 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-headline-lg text-xl font-bold uppercase tracking-wider text-ink-primary">Contract Invite</h3>
                <p className="font-mono-data text-[10px] text-accent uppercase tracking-wider mt-0.5 font-semibold">Stellar Escrow Network</p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-sm font-ui-label text-ink-secondary leading-relaxed">
                You have received an invite to participate in a TrustLance contract. The contract will hold and release funds securely through a multi-sig escrow system.
              </p>

              <div className="p-4 bg-bg-interactive rounded-2xl space-y-3.5 border border-edge-neutral">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <p className="font-mono-data text-xs text-ink-secondary">Funds are locked securely in the smart contract.</p>
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
          </m.div>
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
