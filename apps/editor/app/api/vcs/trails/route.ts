import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVCSProvider } from '@/lib/vcs'
import type { VCSProviderType } from '@/lib/vcs'
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
    const branch = searchParams.get('branch') || undefined

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Missing owner or repo parameter' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const proCheck = await requireProSubscription()
    if (proCheck) return proCheck

    const rl = await rateLimit(`vcs:${user.id}`, { limit: 30, windowMs: 60_000 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.provider_token
    const providerType = session?.user?.app_metadata?.provider as VCSProviderType | undefined

    if (!accessToken || !providerType) {
      return NextResponse.json({ error: 'No VCS provider connected' }, { status: 401 })
    }

    if (providerType !== 'github' && providerType !== 'gitlab') {
      return NextResponse.json(
        { error: `Unsupported VCS provider: ${providerType}` },
        { status: 400 }
      )
    }

    const provider = getVCSProvider(providerType, accessToken)

    if (path) {
      const { content, sha } = await provider.getTrail(owner, repo, path, branch)
      return NextResponse.json({ content: JSON.parse(content), sha })
    } else {
      const trails = await provider.getTrails(owner, repo, branch)
      return NextResponse.json({ trails })
    }
  } catch (error) {
    console.error('Error fetching trails:', error)
    return NextResponse.json({ error: 'Failed to fetch trails' }, { status: 500 })
  }
}
