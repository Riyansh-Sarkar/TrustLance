import { usePostHog } from 'posthog-js/react'

export const useAnalytics = () => {
  const posthog = usePostHog()

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(eventName, properties)
    }
  }

  const trackWalletConnected = (walletAddress: string) => {
    trackEvent('wallet_connected', { wallet: walletAddress })
    if (posthog) {
      posthog.identify(walletAddress)
    }
  }

  const trackOnboardingCompleted = (walletAddress: string, role: string) => {
    trackEvent('onboarding_completed', { wallet: walletAddress, role })
  }

  const trackContractCreateStarted = (walletAddress: string) => {
    trackEvent('contract_create_started', { wallet: walletAddress })
  }

  const trackContractCreateCompleted = (walletAddress: string, contractId: string) => {
    trackEvent('contract_create_completed', { wallet: walletAddress, contractId })
  }

  const trackContractFunded = (walletAddress: string, contractId: string, amount: string) => {
    trackEvent('contract_funded', { wallet: walletAddress, contractId, amount })
  }

  const trackMilestoneSubmitted = (walletAddress: string, contractId: string, milestoneIndex: number) => {
    trackEvent('milestone_submitted', { wallet: walletAddress, contractId, milestoneIndex })
  }

  const trackMilestoneApproved = (walletAddress: string, contractId: string, milestoneIndex: number) => {
    trackEvent('milestone_approved', { wallet: walletAddress, contractId, milestoneIndex })
  }

  const trackPayoutReleased = (walletAddress: string, contractId: string, amount: string) => {
    trackEvent('payout_released', { wallet: walletAddress, contractId, amount })
  }
  
  const trackFeedbackShown = (walletAddress: string) => {
    trackEvent('feedback_prompt_shown', { wallet: walletAddress })
  }
  
  const trackFeedbackSubmitted = (walletAddress: string, rating: number) => {
    trackEvent('feedback_submitted', { wallet: walletAddress, rating })
  }
  
  const trackInviteSent = (walletAddress: string, contractId: string) => {
    trackEvent('invite_sent', { wallet: walletAddress, contractId })
  }

  return {
    trackEvent,
    trackWalletConnected,
    trackOnboardingCompleted,
    trackContractCreateStarted,
    trackContractCreateCompleted,
    trackContractFunded,
    trackMilestoneSubmitted,
    trackMilestoneApproved,
    trackPayoutReleased,
    trackFeedbackShown,
    trackFeedbackSubmitted,
    trackInviteSent,
  }
}
