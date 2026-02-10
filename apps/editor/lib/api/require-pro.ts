import { NextResponse } from 'next/server'
import { getSubscriptionStatus } from '@/lib/stripe/subscription'

/**
 * Require an active Pro subscription or valid trial.
 * Returns null if authorized, or a 403 NextResponse.
 */
export async function requireProSubscription(): Promise<NextResponse | null> {
  const { isPro, isExpired } = await getSubscriptionStatus()

  if (isExpired) {
    return NextResponse.json(
      { error: 'Trial expired — please upgrade to continue' },
      { status: 403 }
    )
  }

  if (!isPro) {
    return NextResponse.json(
      { error: 'Pro subscription required' },
      { status: 403 }
    )
  }

  return null
}
