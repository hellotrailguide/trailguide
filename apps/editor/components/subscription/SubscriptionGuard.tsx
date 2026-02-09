'use client'

import { useSubscription } from '@/lib/hooks/use-subscription'
import { TrialBanner } from './TrialBanner'
import { PaywallModal } from './PaywallModal'

interface SubscriptionGuardProps {
  children: React.ReactNode
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isLoading, isTrialing, isExpired, daysRemaining } = useSubscription()

  // Don't show anything while loading to avoid flash
  if (isLoading) {
    return <>{children}</>
  }

  return (
    <>
      {/* Trial banner for users on trial */}
      {isTrialing && daysRemaining !== null && (
        <TrialBanner daysRemaining={daysRemaining} />
      )}

      {/* Main content */}
      {children}

      {/* Paywall modal for expired trials - blocks interaction */}
      {isExpired && <PaywallModal />}
    </>
  )
}
