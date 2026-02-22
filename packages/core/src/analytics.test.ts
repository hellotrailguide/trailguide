import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { sendEvent, resetSession } from './analytics'
import type { AnalyticsConfig } from './types'

const ENDPOINT = 'http://test.local/api/analytics'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  resetSession()
})

const baseConfig: AnalyticsConfig = {
  endpoint: ENDPOINT,
  userId: 'user-abc',
  debug: false,
}

describe('sendEvent', () => {
  it('POSTs to endpoint with correct body shape', async () => {
    let captured: Record<string, unknown> | null = null

    server.use(
      http.post(ENDPOINT, async ({ request }) => {
        captured = await request.json() as Record<string, unknown>
        return HttpResponse.json({ success: true })
      })
    )

    await sendEvent(baseConfig, {
      event_type: 'trail_started',
      trail_id: 'my-trail',
    })

    expect(captured).not.toBeNull()
    expect(captured!.event_type).toBe('trail_started')
    expect(captured!.trail_id).toBe('my-trail')
    expect(captured!.user_id).toBe('user-abc')
    expect(typeof captured!.session_id).toBe('string')
    expect(typeof captured!.timestamp).toBe('string')
  })

  it('session ID is stable across calls without reset', async () => {
    const sessionIds: string[] = []

    server.use(
      http.post(ENDPOINT, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>
        sessionIds.push(body.session_id as string)
        return HttpResponse.json({ success: true })
      })
    )

    await sendEvent(baseConfig, { event_type: 'trail_started', trail_id: 'trail-1' })
    await sendEvent(baseConfig, { event_type: 'step_viewed', trail_id: 'trail-1' })

    expect(sessionIds).toHaveLength(2)
    expect(sessionIds[0]).toBe(sessionIds[1])
  })

  it('generates a new session ID after resetSession()', async () => {
    const sessionIds: string[] = []

    server.use(
      http.post(ENDPOINT, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>
        sessionIds.push(body.session_id as string)
        return HttpResponse.json({ success: true })
      })
    )

    await sendEvent(baseConfig, { event_type: 'trail_started', trail_id: 'trail-1' })
    resetSession()
    await sendEvent(baseConfig, { event_type: 'trail_started', trail_id: 'trail-1' })

    expect(sessionIds[0]).not.toBe(sessionIds[1])
  })

  it('is silent on network error when debug:false', async () => {
    server.use(
      http.post(ENDPOINT, () => HttpResponse.error())
    )

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await sendEvent({ ...baseConfig, debug: false }, {
      event_type: 'trail_started',
      trail_id: 'trail-1',
    })
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('logs on network error when debug:true', async () => {
    server.use(
      http.post(ENDPOINT, () => HttpResponse.error())
    )

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await sendEvent({ ...baseConfig, debug: true }, {
      event_type: 'trail_started',
      trail_id: 'trail-1',
    })
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('is a no-op when config.endpoint is falsy', async () => {
    let called = false
    server.use(
      http.post(ENDPOINT, () => {
        called = true
        return HttpResponse.json({ success: true })
      })
    )

    await sendEvent({ ...baseConfig, endpoint: '' }, {
      event_type: 'trail_started',
      trail_id: 'trail-1',
    })

    expect(called).toBe(false)
  })
})
