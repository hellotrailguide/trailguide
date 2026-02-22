import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock } from '@/test/helpers'

const { mockCreatePortalSession } = vi.hoisted(() => ({
  mockCreatePortalSession: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/session/test' }),
}))

let supabaseMock: ReturnType<typeof makeSupabaseMock>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => supabaseMock),
}))

vi.mock('@/lib/stripe/client', () => ({
  createPortalSession: mockCreatePortalSession,
}))

vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 }),
}))

import { POST } from './route'
import { rateLimit } from '@/lib/api/rate-limit'

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    mockCreatePortalSession.mockResolvedValue({ url: 'https://billing.stripe.com/session/test' })
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 })
    // Default: user has a stripe_customer_id
    supabaseMock.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: 'cus_123' },
            error: null,
          }),
        })),
      })),
    }))
  })

  it('returns 401 when unauthenticated', async () => {
    supabaseMock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: new Error('No auth'),
    })
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('returns 404 when no stripe customer id', async () => {
    supabaseMock.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    }))
    const res = await POST()
    expect(res.status).toBe(404)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 })
    const res = await POST()
    expect(res.status).toBe(429)
  })

  it('returns 200 with portal url on success', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toContain('billing.stripe.com')
  })
})
