import { describe, it, expect, vi } from 'vitest'
import { runTrail } from './index'
import type { Trail } from '@trailguide/core'

// Minimal Page mock
function makePage() {
  const locator = {
    waitFor: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    dblclick: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    pressSequentially: vi.fn().mockResolvedValue(undefined),
    selectOption: vi.fn().mockResolvedValue(undefined),
    check: vi.fn().mockResolvedValue(undefined),
    hover: vi.fn().mockResolvedValue(undefined),
    press: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
  }
  const context = {
    pages: vi.fn().mockReturnValue([]),
    waitForEvent: vi.fn().mockResolvedValue({ waitForLoadState: vi.fn().mockResolvedValue(undefined) }),
  }
  return {
    url: vi.fn().mockReturnValue('https://example.com/'),
    goto: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn().mockReturnValue(locator),
    evaluate: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue(undefined),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    context: vi.fn().mockReturnValue(context),
    _locator: locator,
    _context: context,
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
    it('click', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#btn', placement: 'bottom', title: 'T', content: 'C', action: 'click' }] }))
      expect(page._locator.click).toHaveBeenCalledWith()
    })

    it('rightClick', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#btn', placement: 'bottom', title: 'T', content: 'C', action: 'rightClick' }] }))
      expect(page._locator.click).toHaveBeenCalledWith({ button: 'right' })
    })

    it('dblclick', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#btn', placement: 'bottom', title: 'T', content: 'C', action: 'dblclick' }] }))
      expect(page._locator.dblclick).toHaveBeenCalled()
    })

    it('fill with value', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#inp', placement: 'bottom', title: 'T', content: 'C', action: 'fill', value: 'hello' }] }))
      expect(page._locator.fill).toHaveBeenCalledWith('hello')
    })

    it('type with value', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#inp', placement: 'bottom', title: 'T', content: 'C', action: 'type', value: 'hello' }] }))
      expect(page._locator.pressSequentially).toHaveBeenCalledWith('hello')
    })

    it('press with key', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#inp', placement: 'bottom', title: 'T', content: 'C', action: 'press', value: 'Enter' }] }))
      expect(page._locator.press).toHaveBeenCalledWith('Enter')
    })

    it('scroll uses page.evaluate for body', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: 'body', placement: 'bottom', title: 'T', content: 'C', action: 'scroll', value: '0,500' }] }))
      expect(page.evaluate).toHaveBeenCalled()
    })

    it('evaluate runs JS on page', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: 'body', placement: 'bottom', title: 'T', content: 'C', action: 'evaluate', value: 'document.title' }] }))
      expect(page.evaluate).toHaveBeenCalledWith('document.title')
    })
  })

  describe('wait conditions', () => {
    it('networkIdle calls waitForLoadState', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#btn', placement: 'bottom', title: 'T', content: 'C', wait: { type: 'networkIdle' } }] }))
      expect(page.waitForLoadState).toHaveBeenCalledWith('networkidle')
    })

    it('timeout calls waitForTimeout', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#btn', placement: 'bottom', title: 'T', content: 'C', wait: { type: 'timeout', value: '500' } }] }))
      expect(page.waitForTimeout).toHaveBeenCalledWith(500)
    })

    it('selector calls waitForSelector', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#btn', placement: 'bottom', title: 'T', content: 'C', wait: { type: 'selector', value: '#loaded' } }] }))
      expect(page.waitForSelector).toHaveBeenCalledWith('#loaded', { timeout: 8000 })
    })
  })

  describe('step url navigation', () => {
    it('navigates to step.url if not already on that page', async () => {
      const page = makePage()
      await runTrail(page as any, makeTrail({ steps: [{ id: 's1', target: '#btn', placement: 'bottom', title: 'T', content: 'C', url: '/dashboard' }] }), { baseUrl: 'https://example.com' })
      expect(page.goto).toHaveBeenCalledWith('https://example.com/dashboard')
    })
  })
})
