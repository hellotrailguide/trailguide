'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionState {
  isPro: boolean
  isLoading: boolean
  status: string | null
  currentPeriodEnd: Date | null
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    isLoading: true,
    status: null,
    currentPeriodEnd: null,
  })

  useEffect(() => {
    async function loadSubscription() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState({ isPro: false, isLoading: false, status: null, currentPeriodEnd: null })
        return
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .single()

      setState({
        isPro: subscription?.status === 'active',
        isLoading: false,
        status: subscription?.status || null,
        currentPeriodEnd: subscription?.current_period_end
          ? new Date(subscription.current_period_end)
          : null,
      })
    }

    loadSubscription()
  }, [])

  return state
}
