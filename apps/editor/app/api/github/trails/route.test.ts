import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeRequest, makeSupabaseMock } from '@/test/helpers'

const { mockGetTrails, mockGetTrail } = vi.hoisted(() => ({
  mockGetTrails: vi.fn().mockResolvedValue([
    { name: 'onboarding.trail.json', path: 'tours/onboarding.trail.json', sha: 'abc', type: 'file' },
  ]),
  mockGetTrail: vi.fn().mockResolvedValue({ content: '{"id":"onboarding"}', sha: 'def' }),
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
  getTrails: mockGetTrails,
  getTrail: mockGetTrail,
}))

import { GET } from './route'
import { requireProSubscription } from '@/lib/api/require-pro'

describe('GET /api/github/trails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    mockGetTrails.mockResolvedValue([
      { name: 'onboarding.trail.json', path: 'tours/onboarding.trail.json', sha: 'abc', type: 'file' },
    ])
    mockGetTrail.mockResolvedValue({ content: '{"id":"onboarding"}', sha: 'def' })
    vi.mocked(requireProSubscription).mockResolvedValue(null)
  })

  it('returns 400 when owner is missing', async () => {
    const req = makeRequest('GET', 'http://localhost/api/github/trails?repo=my-repo')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when repo is missing', async () => {
    const req = makeRequest('GET', 'http://localhost/api/github/trails?owner=user')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    supabaseMock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: new Error('No auth'),
    })

    const req = makeRequest('GET', 'http://localhost/api/github/trails?owner=user&repo=repo')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when no pro subscription', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireProSubscription).mockResolvedValueOnce(
      NextResponse.json({ error: 'Pro required' }, { status: 403 })
    )

    const req = makeRequest('GET', 'http://localhost/api/github/trails?owner=user&repo=repo')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 with trails array when no path param', async () => {
    const req = makeRequest('GET', 'http://localhost/api/github/trails?owner=user&repo=repo')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.trails)).toBe(true)
  })

  it('returns 200 with { content, sha } when path param provided', async () => {
    const req = makeRequest(
      'GET',
      'http://localhost/api/github/trails?owner=user&repo=repo&path=tours/onboarding.trail.json'
    )
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.content).toBeDefined()
    expect(body.sha).toBe('def')
  })
})
