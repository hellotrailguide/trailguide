import { describe, it, expect, vi } from 'vitest'
import { runTrail } from './index'
import type { Trail } from '@trailguide/core'

// Minimal Page mock
function makePage() {
  const locator = {
    waitFor: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    selectOption: vi.fn().mockResolvedValue(undefined),
    check: vi.fn().mockResolvedValue(undefined),
    hover: vi.fn().mockResolvedValue(undefined),
  }
  return {
    url: vi.fn().mockReturnValue('https://example.com/'),
    goto: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn().mockReturnValue(locator),
    _locator: locator,
  }
}

function makeTrail(overrides: Partial<Trail> = {}): Trail {
  return {
    id: 'test-trail',
    title: 'Test Trail',
    version: '1.0.0',
    steps: [
      { id: 's1', target: '#btn', placement: 'bottom', title: 'Step 1', content: 'Do this' },
    ],
    ...overrides,
  }
}

describe('runTrail', () => {
  describe('mode guard', () => {
    it('skips entirely when mode is "tour"', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ mode: 'tour' }))
      expect(page.locator).not.toHaveBeenCalled()
    })

    it('runs when mode is "test"', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ mode: 'test' }))
      expect(page.locator).toHaveBeenCalledWith('#btn')
    })

    it('runs when mode is "both"', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ mode: 'both' }))
      expect(page.locator).toHaveBeenCalledWith('#btn')
    })

    it('runs when mode is undefined', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail())
      expect(page.locator).toHaveBeenCalledWith('#btn')
    })
  })

  describe('actions', () => {
    it('calls click() for action: "click"', async () => {
      const page = makePage()
      const trail = makeTrail({
        steps: [{ id: 's1', target: '#btn', placement: 'bottom', title: 'T', content: 'C', action: 'click' }],
      })
      await runTrail(page as any, trail)
      expect(page._locator.click).toHaveBeenCalled()
    })

    it('calls fill() with value for action: "fill"', async () => {
      const page = makePage()
      const trail = makeTrail({
        steps: [{ id: 's1', target: '#inp', placement: 'bottom', title: 'T', content: 'C', action: 'fill', value: 'hello' }],
      })
      await runTrail(page as any, trail)
      expect(page._locator.fill).toHaveBeenCalledWith('hello')
    })
  })

  describe('step url navigation', () => {
    it('navigates to step.url if not already on that page', async () => {
      const page = makePage()
      const trail = makeTrail({
        steps: [{ id: 's1', target: '#btn', placement: 'bottom', title: 'T', content: 'C', url: '/dashboard' }],
      })
      await runTrail(page as any, trail, { baseUrl: 'https://example.com' })
      expect(page.goto).toHaveBeenCalledWith('https://example.com/dashboard')
    })
  })
})
