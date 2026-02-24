import { vi } from 'vitest'
import { NextRequest } from 'next/server'

export function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  const init: { method: string; body?: string; headers?: Record<string, string> } = { method }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new NextRequest(url, init)
}

export function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: {
      status: 'active',
      current_period_end: new Date(Date.now() + 86400000).toISOString(),
    },
    error: null,
  })
  const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockOrder = vi.fn(() => ({ limit: mockLimit }))
  const mockGte = vi.fn(() => ({ order: mockOrder, limit: mockLimit }))
  const mockEq = vi.fn(function () {
    return {
      eq: mockEq,
      gte: mockGte,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    }
  })
  const mockSelect = vi.fn(() => ({ eq: mockEq, gte: mockGte, order: mockOrder, limit: mockLimit, single: mockSingle }))
  const mockInsert = vi.fn().mockResolvedValue({ error: null })
  const mockUpsert = vi.fn().mockResolvedValue({ error: null })
  const mockUpdate = vi.fn(() => ({ eq: mockEq }))

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    upsert: mockUpsert,
    update: mockUpdate,
    eq: mockEq,
  }))

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { provider_token: 'github-token-abc' } },
        error: null,
      }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    from: mockFrom,
    ...overrides,
  }
}
