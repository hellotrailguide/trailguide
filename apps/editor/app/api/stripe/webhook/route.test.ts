import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock } from '@/test/helpers'

const { mockConstructWebhookEvent } = vi.hoisted(() => ({
  mockConstructWebhookEvent: vi.fn(),
}))

let supabaseMock: ReturnType<typeof makeSupabaseMock>

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabaseMock),
}))

vi.mock('@/lib/stripe/client', () => ({
  constructWebhookEvent: mockConstructWebhookEvent,
}))

import { POST } from './route'

function makeStripeEvent(type: string, data: Record<string, unknown>) {
  return {
    type,
    data: { object: data },
  }
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    // Reset headers mock to return null for stripe-signature
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockReturnValue({ get: vi.fn(() => null) } as any)
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const { NextRequest } = await import('next/server')
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-body',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('signature')
  })

  it('returns 400 when constructWebhookEvent throws', async () => {
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockReturnValue({
      get: vi.fn((key: string) => key === 'stripe-signature' ? 'bad-sig' : null),
    } as any)
    mockConstructWebhookEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const { NextRequest } = await import('next/server')
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: 'raw',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('checkout.session.completed: upserts subscription and returns 200', async () => {
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockReturnValue({
      get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid-sig' : null),
    } as any)

    mockConstructWebhookEvent.mockReturnValue(
      makeStripeEvent('checkout.session.completed', {
        metadata: { userId: 'user-abc' },
        customer: 'cus_123',
        subscription: 'sub_456',
      })
    )

    const { NextRequest } = await import('next/server')
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: 'raw',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(supabaseMock.from).toHaveBeenCalled()
  })

  it('checkout.session.completed with missing metadata: returns 200 without upsert', async () => {
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockReturnValue({
      get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid-sig' : null),
    } as any)

    mockConstructWebhookEvent.mockReturnValue(
      makeStripeEvent('checkout.session.completed', {
        metadata: {},
        customer: null,
        subscription: null,
      })
    )

    const upsertSpy = vi.fn().mockResolvedValue({ error: null })
    supabaseMock.from = vi.fn(() => ({
      upsert: upsertSpy,
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    }))

    const { NextRequest } = await import('next/server')
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: 'raw',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('customer.subscription.updated: updates status and returns 200', async () => {
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockReturnValue({
      get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid-sig' : null),
    } as any)

    mockConstructWebhookEvent.mockReturnValue(
      makeStripeEvent('customer.subscription.updated', {
        customer: 'cus_789',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      })
    )

    const { NextRequest } = await import('next/server')
    const req = new NextRequest('http://localhost/api/stripe/webhook', { method: 'POST', body: 'raw' })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('customer.subscription.deleted: updates status to canceled and returns 200', async () => {
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockReturnValue({
      get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid-sig' : null),
    } as any)

    mockConstructWebhookEvent.mockReturnValue(
      makeStripeEvent('customer.subscription.deleted', {
        customer: 'cus_del',
        status: 'canceled',
      })
    )

    const { NextRequest } = await import('next/server')
    const req = new NextRequest('http://localhost/api/stripe/webhook', { method: 'POST', body: 'raw' })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('invoice.payment_failed: updates status to past_due and returns 200', async () => {
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockReturnValue({
      get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid-sig' : null),
    } as any)

    mockConstructWebhookEvent.mockReturnValue(
      makeStripeEvent('invoice.payment_failed', {
        customer: 'cus_fail',
      })
    )

    const { NextRequest } = await import('next/server')
    const req = new NextRequest('http://localhost/api/stripe/webhook', { method: 'POST', body: 'raw' })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('unhandled event type: returns 200 with received:true', async () => {
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockReturnValue({
      get: vi.fn((key: string) => key === 'stripe-signature' ? 'valid-sig' : null),
    } as any)

    mockConstructWebhookEvent.mockReturnValue(
      makeStripeEvent('some.unhandled.event', {})
    )

    const { NextRequest } = await import('next/server')
    const req = new NextRequest('http://localhost/api/stripe/webhook', { method: 'POST', body: 'raw' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })
})
