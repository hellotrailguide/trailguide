import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Insert event into database
    const { error } = await getSupabaseAdmin().from('analytics_events').insert({
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

// GET endpoint for fetching analytics data
export async function GET(request: NextRequest) {
  try {
    const { createClient: createServerClient } = await import('@/lib/supabase/server')
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const trailId = searchParams.get('trail_id')
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = getSupabaseAdmin()
      .from('analytics_events')
      .select('*')
      .eq('user_id', user.id)
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
