'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionState {
  // Core status
  isPro: boolean
  isLoading: boolean
  status: string | null

  // Trial-specific
  isTrialing: boolean
  isExpired: boolean
  daysRemaining: number | null
  trialEndsAt: Date | null

  // Billing
  currentPeriodEnd: Date | null
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    isLoading: true,
    status: null,
    isTrialing: false,
    isExpired: false,
    daysRemaining: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
  })

  const loadSubscription = useCallback(async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setState({
        isPro: false,
        isLoading: false,
        status: null,
        isTrialing: false,
        isExpired: false,
        daysRemaining: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
      })
      return
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      setState({
        isPro: false,
        isLoading: false,
        status: null,
        isTrialing: false,
        isExpired: false,
        daysRemaining: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
      })
      return
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

    setState({
      isPro,
      isLoading: false,
      status: subscription.status,
      isTrialing: isTrialing && !trialExpired,
      isExpired,
      daysRemaining,
      trialEndsAt: isTrialing ? currentPeriodEnd : null,
      currentPeriodEnd,
    })
  }, [])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  // Poll for updated status after Stripe checkout redirect.
  // The webhook may arrive after the page loads, so poll until status is 'active'.
  useEffect(() => {
    const isCheckoutReturn = window.location.search.includes('success=true')
    if (!isCheckoutReturn) return
    if (state.isLoading) return
    if (state.status === 'active') return

    const interval = setInterval(loadSubscription, 1500)
    const timeout = setTimeout(() => clearInterval(interval), 15000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [state.isLoading, state.status, loadSubscription])

  return state
}
