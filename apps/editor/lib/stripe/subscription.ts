import { createClient } from '@/lib/supabase/server'

export interface SubscriptionStatus {
  isPro: boolean
  status: string | null
  currentPeriodEnd: Date | null
}

/**
 * Check if user has an active Pro subscription
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isPro: false, status: null, currentPeriodEnd: null }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .single()

  if (!subscription) {
    return { isPro: false, status: null, currentPeriodEnd: null }
  }

  const isPro = subscription.status === 'active'
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null

  return {
    isPro,
    status: subscription.status,
    currentPeriodEnd,
  }
}

/**
 * Require Pro subscription - throws if not subscribed
 */
export async function requirePro(): Promise<void> {
  const { isPro } = await getSubscriptionStatus()

  if (!isPro) {
    throw new Error('Pro subscription required')
  }
}
