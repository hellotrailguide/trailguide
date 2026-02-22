import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeRequest, makeSupabaseMock } from '@/test/helpers'

const { mockCommitFile, mockCreateTrailPR } = vi.hoisted(() => ({
  mockCommitFile: vi.fn().mockResolvedValue({
    sha: 'commit-sha-123',
    html_url: 'https://github.com/user/repo/commit/commit-sha-123',
  }),
  mockCreateTrailPR: vi.fn().mockResolvedValue({
    number: 42,
    html_url: 'https://github.com/user/repo/pull/42',
  }),
}))

let supabaseMock: ReturnType<typeof makeSupabaseMock>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => supabaseMock),
}))

vi.mock('@/lib/api/require-pro', () => ({
  requireProSubscription: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 }),
}))

vi.mock('@/lib/github/client', () => ({
  commitFile: mockCommitFile,
  createTrailPR: mockCreateTrailPR,
}))

import { POST } from './route'
import { requireProSubscription } from '@/lib/api/require-pro'
import { rateLimit } from '@/lib/api/rate-limit'

const validBody = {
  owner: 'user',
  repo: 'my-repo',
  path: 'tours/onboarding.trail.json',
  content: { id: 'onboarding', steps: [] },
  message: 'Update onboarding trail',
}

describe('POST /api/github/commit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    mockCommitFile.mockResolvedValue({
      sha: 'commit-sha-123',
      html_url: 'https://github.com/user/repo/commit/commit-sha-123',
    })
    mockCreateTrailPR.mockResolvedValue({
      number: 42,
      html_url: 'https://github.com/user/repo/pull/42',
    })
    vi.mocked(requireProSubscription).mockResolvedValue(null)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 })
  })

  it('returns 400 when owner is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/github/commit', {
      ...validBody,
      owner: undefined,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when repo is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/github/commit', {
      ...validBody,
      repo: undefined,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when path is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/github/commit', {
      ...validBody,
      path: undefined,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when content is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/github/commit', {
      ...validBody,
      content: undefined,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when message is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/github/commit', {
      ...validBody,
      message: undefined,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    supabaseMock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: new Error('No auth'),
    })

    const req = makeRequest('POST', 'http://localhost/api/github/commit', validBody)
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when no pro subscription', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireProSubscription).mockResolvedValueOnce(
      NextResponse.json({ error: 'Pro required' }, { status: 403 })
    )

    const req = makeRequest('POST', 'http://localhost/api/github/commit', validBody)
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 429 when rate limited (10/min)', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    })

    const req = makeRequest('POST', 'http://localhost/api/github/commit', validBody)
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('returns 200 { type:"commit", commit:{sha,url} } for direct commit', async () => {
    const req = makeRequest('POST', 'http://localhost/api/github/commit', validBody)
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.type).toBe('commit')
    expect(body.commit.sha).toBe('commit-sha-123')
    expect(body.commit.url).toContain('github.com')
  })

  it('returns 200 { type:"pr", pr:{number,url} } when createPR:true', async () => {
    const req = makeRequest('POST', 'http://localhost/api/github/commit', {
      ...validBody,
      createPR: true,
      prTitle: 'Add onboarding trail',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.type).toBe('pr')
    expect(body.pr.number).toBe(42)
    expect(body.pr.url).toContain('github.com')
  })
})
