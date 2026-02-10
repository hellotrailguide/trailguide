import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listRepos } from '@/lib/github/client'
import { requireProSubscription } from '@/lib/api/require-pro'
import { rateLimit } from '@/lib/api/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Require Pro subscription
    const proCheck = await requireProSubscription()
    if (proCheck) return proCheck

    // Rate limit
    const rl = await rateLimit(`github:${user.id}`, { limit: 30, windowMs: 60_000 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Get GitHub access token from session
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.provider_token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'GitHub not connected. Please reconnect your GitHub account.' },
        { status: 401 }
      )
    }

    const repos = await listRepos(accessToken)

    return NextResponse.json({ repos })
  } catch (error) {
    console.error('Error fetching repos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}
