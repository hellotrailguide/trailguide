import { createClient } from '@/lib/supabase/server'

export interface SubscriptionStatus {
  // Core status
  isPro: boolean
  status: string | null

  // Trial-specific
  isTrialing: boolean
  isExpired: boolean
  daysRemaining: number | null
  trialEndsAt: Date | null

  // Billing
  currentPeriodEnd: Date | null
}

/**
 * Check if user has an active Pro subscription or valid trial
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      isPro: false,
      status: null,
      isTrialing: false,
      isExpired: false,
      daysRemaining: null,
      trialEndsAt: null,
      currentPeriodEnd: null,
    }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .single()

  if (!subscription) {
    return {
      isPro: false,
      status: null,
      isTrialing: false,
      isExpired: false,
      daysRemaining: null,
      trialEndsAt: null,
      currentPeriodEnd: null,
    }
  }

  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null

  const now = new Date()
  const isTrialing = subscription.status === 'trialing'
  const isActive = subscription.status === 'active'

  // Check if trial has expired
  const trialExpired = isTrialing && currentPeriodEnd !== null && currentPeriodEnd < now
  const isExpired = subscription.status === 'expired' || trialExpired

  // Calculate days remaining for trial
  let daysRemaining: number | null = null
  if (isTrialing && currentPeriodEnd && !trialExpired) {
    const msRemaining = currentPeriodEnd.getTime() - now.getTime()
    daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
  }

  // isPro if active subscription OR valid trial (not expired)
  const isPro = isActive || (isTrialing && !trialExpired)

  return {
    isPro,
    status: subscription.status,
    isTrialing: isTrialing && !trialExpired,
    isExpired,
    daysRemaining,
    trialEndsAt: isTrialing ? currentPeriodEnd : null,
    currentPeriodEnd,
  }
}

/**
 * Require Pro subscription - throws if not subscribed or trial expired
 */
export async function requirePro(): Promise<void> {
  const { isPro, isExpired } = await getSubscriptionStatus()

  if (isExpired) {
    throw new Error('Trial expired - please upgrade to continue')
  }

  if (!isPro) {
    throw new Error('Pro subscription required')
  }
}
