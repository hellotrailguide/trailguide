import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api/require-auth'
import { requireProSubscription } from '@/lib/api/require-pro'
import { rateLimit } from '@/lib/api/rate-limit'

export const dynamic = 'force-dynamic'

// Lazy initialization for admin client (service role)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface AnalyticsEvent {
  event: string
  trail_id: string
  step_id?: string
  step_index?: number
  timestamp: string
  session_id: string
  user_id: string // The trail owner's user ID (from trail config)
  metadata?: Record<string, unknown>
}

// Validate event types
const validEventTypes = [
  'trail_started',
  'step_viewed',
  'step_completed',
  'trail_completed',
  'trail_skipped',
]

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP: 100 requests per minute
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await rateLimit(`analytics:${ip}`, { limit: 100, windowMs: 60_000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      )
    }

    const body: AnalyticsEvent = await request.json()

    // Validate required fields
    if (!body.event || !body.trail_id || !body.session_id || !body.user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: event, trail_id, session_id, user_id' },
        { status: 400 }
      )
    }

    // Validate event type
    if (!validEventTypes.includes(body.event)) {
      return NextResponse.json(
        { error: `Invalid event type. Valid types: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate user_id format (must be a valid UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(body.user_id)) {
      return NextResponse.json({ error: 'Invalid user_id format' }, { status: 400 })
    }

    // Verify the user_id corresponds to an actual user with an active subscription
    // This prevents arbitrary data injection for non-existent users
    const admin = getSupabaseAdmin()
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', body.user_id)
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 403 })
    }

    // Check that the subscription is active or trialing (not expired)
    const isActive = subscription.status === 'active'
    const isTrialing = subscription.status === 'trialing'
    const notExpired = subscription.current_period_end
      ? new Date(subscription.current_period_end) > new Date()
      : false

    if (!isActive && !(isTrialing && notExpired)) {
      return NextResponse.json({ error: 'Subscription inactive' }, { status: 403 })
    }

    // Insert event into database
    const { error } = await admin.from('analytics_events').insert({
      trail_id: body.trail_id,
      user_id: body.user_id,
      event_type: body.event,
      step_id: body.step_id || null,
      step_index: body.step_index ?? null,
      session_id: body.session_id,
    })

    if (error) {
      console.error('Failed to insert analytics event:', error)
      return NextResponse.json(
        { error: 'Failed to record event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}

// GET endpoint for fetching analytics data (requires auth + Pro)
export async function GET(request: NextRequest) {
  try {
    // Require authenticated user
    const auth = await requireAuth()
    if (auth.error) return auth.error

    // Require Pro subscription
    const proCheck = await requireProSubscription()
    if (proCheck) return proCheck

    // Rate limit: 30 requests per minute per user
    const rl = await rateLimit(`analytics-get:${auth.user.id}`, { limit: 30, windowMs: 60_000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const trailId = searchParams.get('trail_id')
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = getSupabaseAdmin()
      .from('analytics_events')
      .select('*')
      .eq('user_id', auth.user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (trailId) {
      query = query.eq('trail_id', trailId)
    }

    const { data: events, error } = await query.limit(10000)

    if (error) {
      console.error('Failed to fetch analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
