import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock } from '@/test/helpers'

const { mockCreateCheckoutSession } = vi.hoisted(() => ({
  mockCreateCheckoutSession: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/pay/test' }),
}))

let supabaseMock: ReturnType<typeof makeSupabaseMock>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => supabaseMock),
}))

vi.mock('@/lib/stripe/client', () => ({
  createCheckoutSession: mockCreateCheckoutSession,
}))

vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 }),
}))

import { POST } from './route'
import { rateLimit } from '@/lib/api/rate-limit'

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    mockCreateCheckoutSession.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/test' })
    vi.mocked(rateLimit).mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 })
  })

  it('returns 401 when unauthenticated', async () => {
    supabaseMock.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: new Error('No auth'),
    })

    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    })

    const res = await POST()
    expect(res.status).toBe(429)
  })

  it('returns 200 with { url } on success', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/pay/test')
  })

  it('passes correct args to createCheckoutSession', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'

    await POST()

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      'user-123',
      'test@example.com',
      expect.stringContaining('settings?success=true'),
      expect.stringContaining('settings?canceled=true')
    )

    delete process.env.NEXT_PUBLIC_APP_URL
  })
})
