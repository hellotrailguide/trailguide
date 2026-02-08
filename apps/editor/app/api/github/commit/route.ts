import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { commitFile, createTrailPR } from '@/lib/github/client'

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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    if (createPR) {
      // Create branch + commit + PR
      const pr = await createTrailPR(
        owner,
        repo,
        content,
        path,
        prTitle || message,
        accessToken
      )

      return NextResponse.json({
        success: true,
        type: 'pr',
        pr: {
          number: pr.number,
          url: pr.html_url,
        },
      })
    } else {
      // Direct commit to default branch
      const contentString = JSON.stringify(content, null, 2)
      const commit = await commitFile(
        owner,
        repo,
        path,
        contentString,
        message,
        accessToken,
        sha
      )

      return NextResponse.json({
        success: true,
        type: 'commit',
        commit: {
          sha: commit.sha,
          url: commit.html_url,
        },
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
