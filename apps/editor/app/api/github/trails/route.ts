import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrails, getTrail } from '@/lib/github/client'
import { requireProSubscription } from '@/lib/api/require-pro'
import { rateLimit } from '@/lib/api/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const path = searchParams.get('path')

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing owner or repo parameter' },
        { status: 400 }
      )
    }

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
        { error: 'GitHub not connected' },
        { status: 401 }
      )
    }

    if (path) {
      // Get specific trail file
      const { content, sha } = await getTrail(owner, repo, path, accessToken)
      return NextResponse.json({ content, sha })
    } else {
      // List all trails in repo
      const trails = await getTrails(owner, repo, accessToken)
      return NextResponse.json({ trails })
    }
  } catch (error) {
    console.error('Error fetching trails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trails' },
      { status: 500 }
    )
  }
}
