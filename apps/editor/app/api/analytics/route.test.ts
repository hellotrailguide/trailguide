import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeRequest, makeSupabaseMock } from '@/test/helpers'

let supabaseMock: ReturnType<typeof makeSupabaseMock>

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabaseMock),
}))

vi.mock('@/lib/api/require-auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } }),
}))

vi.mock('@/lib/api/require-pro', () => ({
  requireProSubscription: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
}))

import { POST, GET } from './route'
import { requireAuth } from '@/lib/api/require-auth'
import { requireProSubscription } from '@/lib/api/require-pro'
import { rateLimit } from '@/lib/api/rate-limit'

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

const validBody = {
  event_type: 'trail_started',
  trail_id: 'my-trail',
  session_id: 'session-abc',
  user_id: VALID_UUID,
}

describe('POST /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 })
  })

  it('returns 400 when event_type is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/analytics', {
      ...validBody,
      event_type: undefined,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when trail_id is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/analytics', {
      ...validBody,
      trail_id: undefined,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when session_id is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/analytics', {
      ...validBody,
      session_id: undefined,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when user_id is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/analytics', {
      ...validBody,
      user_id: undefined,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid event_type', async () => {
    const req = makeRequest('POST', 'http://localhost/api/analytics', {
      ...validBody,
      event_type: 'invalid_event',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-UUID user_id', async () => {
    const req = makeRequest('POST', 'http://localhost/api/analytics', {
      ...validBody,
      user_id: 'not-a-uuid',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    })
    const req = makeRequest('POST', 'http://localhost/api/analytics', validBody)
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('returns 403 when subscription is not found', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const noSubMock = makeSupabaseMock()
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockEq = vi.fn(function () {
      return { eq: mockEq, single: mockSingle }
    })
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    ;(noSubMock as any).from = vi.fn((table: string) => {
      if (table === 'subscriptions') return { select: mockSelect }
      return { insert: mockInsert }
    })
    vi.mocked(createClient).mockReturnValueOnce(noSubMock as any)

    const req = makeRequest('POST', 'http://localhost/api/analytics', validBody)
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 and inserts event on success', async () => {
    const req = makeRequest('POST', 'http://localhost/api/analytics', validBody)
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } } as any)
    vi.mocked(requireProSubscription).mockResolvedValue(null)
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60000 })
  })

  it('returns 401 when unauthenticated', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireAuth).mockResolvedValueOnce({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as any)

    const req = makeRequest('GET', 'http://localhost/api/analytics')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when no pro subscription', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireProSubscription).mockResolvedValueOnce(
      NextResponse.json({ error: 'Pro required' }, { status: 403 })
    )

    const req = makeRequest('GET', 'http://localhost/api/analytics')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 with events array', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const eventsMock = makeSupabaseMock()
    const mockLimit = vi.fn().mockResolvedValue({ data: [{ id: 1, event_type: 'trail_started' }], error: null })
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockGte = vi.fn(() => ({ order: mockOrder }))
    const mockEq = vi.fn(() => ({ gte: mockGte, order: mockOrder, limit: mockLimit }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    eventsMock.from = vi.fn(() => ({ select: mockSelect }))
    vi.mocked(createClient).mockReturnValueOnce(eventsMock as any)

    const req = makeRequest('GET', 'http://localhost/api/analytics')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(body.events)).toBe(true)
  })
})
