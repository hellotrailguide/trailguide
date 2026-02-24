import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVCSProvider } from '@/lib/vcs'
import type { VCSProviderType } from '@/lib/vcs'
import { requireProSubscription } from '@/lib/api/require-pro'
import { rateLimit } from '@/lib/api/rate-limit'

export const dynamic = 'force-dynamic'

interface CommitRequest {
  owner: string
  repo: string
  path: string
  content: object
  message: string
  sha?: string
  createPR?: boolean
  prTitle?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body: CommitRequest = await request.json()
    const { owner, repo, path, content, message, sha, createPR, prTitle } = body

    if (!owner || !repo || !path || !content || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const proCheck = await requireProSubscription()
    if (proCheck) return proCheck

    const rl = await rateLimit(`vcs-commit:${user.id}`, { limit: 10, windowMs: 60_000 })
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

    if (createPR) {
      const pr = await provider.createTrailPR(owner, repo, content, path, prTitle || message)

      return NextResponse.json({
        success: true,
        type: 'pr',
        pr: { number: pr.number, url: pr.url },
      })
    } else {
      const contentString = JSON.stringify(content, null, 2)
      const commit = await provider.commitFile(owner, repo, path, contentString, message, sha)

      return NextResponse.json({
        success: true,
        type: 'commit',
        commit: { sha: commit.sha, url: commit.url },
      })
    }
  } catch (error) {
    console.error('Error committing:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to commit' },
      { status: 500 }
    )
  }
}
