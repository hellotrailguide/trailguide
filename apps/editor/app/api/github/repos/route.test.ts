import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock } from '@/test/helpers'

const { mockListRepos } = vi.hoisted(() => ({
  mockListRepos: vi.fn().mockResolvedValue([
    { id: 1, name: 'my-repo', full_name: 'user/my-repo', owner: { login: 'user' }, default_branch: 'main', private: false },
  ]),
}))

let supabaseMock: ReturnType<typeof makeSupabaseMock>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => supabaseMock),
}))

vi.mock('@/lib/api/require-pro', () => ({
  requireProSubscription: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60000 }),
}))

vi.mock('@/lib/github/client', () => ({
  listRepos: mockListRepos,
}))

import { GET } from './route'
import { requireProSubscription } from '@/lib/api/require-pro'
import { rateLimit } from '@/lib/api/rate-limit'

describe('GET /api/github/repos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    mockListRepos.mockResolvedValue([
      { id: 1, name: 'my-repo', full_name: 'user/my-repo', owner: { login: 'user' }, default_branch: 'main', private: false },
    ])
    vi.mocked(requireProSubscription).mockResolvedValue(null)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60000 })
  })

  it('returns 401 when unauthenticated', async () => {
    supabaseMock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: new Error('No auth'),
    })

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 403 when no pro subscription', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireProSubscription).mockResolvedValueOnce(
      NextResponse.json({ error: 'Pro required' }, { status: 403 })
    )

    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    })

    const res = await GET()
    expect(res.status).toBe(429)
  })

  it('returns 401 with message when provider_token is missing', async () => {
    supabaseMock.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: { provider_token: null } },
      error: null,
    })

    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toContain('GitHub')
  })

  it('returns 200 with repos array when all checks pass', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.repos)).toBe(true)
    expect(body.repos).toHaveLength(1)
  })
})
