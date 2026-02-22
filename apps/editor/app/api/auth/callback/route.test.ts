import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeSupabaseMock } from '@/test/helpers'

let supabaseMock: ReturnType<typeof makeSupabaseMock>

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => supabaseMock),
}))

import { GET } from './route'

const BASE = 'http://localhost:3000'

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = makeSupabaseMock()
    supabaseMock.auth.exchangeCodeForSession = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'user-123', user_metadata: { user_name: 'testuser' } },
      },
      error: null,
    })
    // profile exists, subscription exists — no inserts needed
    supabaseMock.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }))
  })

  it('redirects to /login when no code param', async () => {
    const req = new Request(`${BASE}/api/auth/callback`)
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects to /login?error= when exchange fails', async () => {
    supabaseMock.auth.exchangeCodeForSession = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid code' },
    })
    const req = new Request(`${BASE}/api/auth/callback?code=bad`)
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login?error=')
  })

  it('redirects to /dashboard on successful login', async () => {
    const req = new Request(`${BASE}/api/auth/callback?code=valid`)
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('respects safe next param', async () => {
    const req = new Request(`${BASE}/api/auth/callback?code=valid&next=/settings`)
    const res = await GET(req)
    expect(res.headers.get('location')).toContain('/settings')
  })

  it('blocks open redirect via absolute URL', async () => {
    const req = new Request(`${BASE}/api/auth/callback?code=valid&next=https://evil.com`)
    const res = await GET(req)
    expect(res.headers.get('location')).not.toContain('evil.com')
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('blocks open redirect via protocol-relative URL', async () => {
    const req = new Request(`${BASE}/api/auth/callback?code=valid&next=//evil.com`)
    const res = await GET(req)
    expect(res.headers.get('location')).not.toContain('evil.com')
    expect(res.headers.get('location')).toContain('/dashboard')
  })
})
