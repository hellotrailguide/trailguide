import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVCSProvider } from '@/lib/vcs'
import type { VCSProviderType } from '@/lib/vcs'
import { requireProSubscription } from '@/lib/api/require-pro'
import { rateLimit } from '@/lib/api/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

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
      return NextResponse.json(
        { error: 'No VCS provider connected. Please reconnect your account.' },
        { status: 401 }
      )
    }

    if (providerType !== 'github' && providerType !== 'gitlab') {
      return NextResponse.json(
        { error: `Unsupported VCS provider: ${providerType}` },
        { status: 400 }
      )
    }

    const provider = getVCSProvider(providerType, accessToken)
    const repos = await provider.listRepos()

    return NextResponse.json({ repos, provider: providerType })
  } catch (error) {
    console.error('Error fetching repos:', error)
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
  }
}
