import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Trailguide, start, stop } from './trailguide'
import { appendElement, makeStep, makeTrail } from './test/fixtures'

// Mock @floating-ui/dom
vi.mock('@floating-ui/dom', () => ({
  computePosition: vi.fn().mockResolvedValue({
    x: 100,
    y: 200,
    placement: 'bottom',
    middlewareData: { arrow: { x: 50, y: undefined } },
  }),
  offset: vi.fn(() => ({})),
  flip: vi.fn(() => ({})),
  shift: vi.fn(() => ({})),
  arrow: vi.fn(() => ({})),
}))

// Flush Promise microtasks
async function flushPromises() {
  await new Promise<void>(resolve => { resolve() })
  await new Promise<void>(resolve => { resolve() })
}

describe('Trailguide class', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function buildTour(stepCount = 2) {
    const steps = Array.from({ length: stepCount }, (_, i) =>
      makeStep({ id: `step-${i}`, target: `#target-${i}` })
    )
    steps.forEach((_, i) => appendElement(`target-${i}`))
    return makeTrail({ steps })
  }

  describe('start()', () => {
    it('appends overlay and tooltip to DOM', () => {
      const tg = new Trailguide()
      const trail = buildTour(1)
      tg.start(trail)
      expect(document.querySelector('.trailguide-overlay')).not.toBeNull()
      expect(document.querySelector('.trailguide-tooltip')).not.toBeNull()
    })

    it('emits trail_started analytics', () => {
      const analyticsConfig = {
        endpoint: 'http://test.local/analytics',
        userId: 'u1',
        debug: false,
      }
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      const tg = new Trailguide({ analytics: analyticsConfig })
      tg.start(buildTour(1))

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://test.local/analytics',
        expect.objectContaining({ method: 'POST' })
      )
      fetchSpy.mockRestore()
    })
  })

  describe('stop()', () => {
    it('removes DOM elements and emits trail_abandoned when active', () => {
      const onAbandoned = vi.fn()
      const tg = new Trailguide({ onAbandoned })
      tg.start(buildTour(1))
      tg.stop()
      expect(document.querySelector('.trailguide-overlay')).toBeNull()
      expect(document.querySelector('.trailguide-tooltip')).toBeNull()
      expect(onAbandoned).toHaveBeenCalled()
    })

    it('cleans up without error when called while inactive', () => {
      const tg = new Trailguide()
      expect(() => tg.stop()).not.toThrow()
    })
  })

  describe('next()', () => {
    it('emits step_completed and advances to next step', async () => {
      const onStepChange = vi.fn()
      const tg = new Trailguide({ onStepChange })
      const trail = buildTour(2)
      tg.start(trail)

      tg.next()

      // Advance past the 100ms guard synchronously
      vi.advanceTimersByTime(200)

      expect(onStepChange).toHaveBeenCalledWith(trail.steps[1], 1)
    })

    it('completes the tour on final step', async () => {
      const onComplete = vi.fn()
      const tg = new Trailguide({ onComplete })
      buildTour(1) // creates target elements, trail built inside buildTour
      const trail = makeTrail({
        steps: [makeStep({ id: 'final-step', target: '#target-0' })]
      })
      // target-0 already appended by buildTour above, no need to re-append

      const tg2 = new Trailguide({ onComplete })
      tg2.start(trail)
      tg2.next()

      vi.advanceTimersByTime(200)

      expect(onComplete).toHaveBeenCalled()
      expect(document.querySelector('.trailguide-overlay')).toBeNull()
    })
  })

  describe('prev()', () => {
    it('goes back one step', async () => {
      const onStepChange = vi.fn()
      const tg = new Trailguide({ onStepChange })
      const trail = buildTour(2)
      tg.start(trail)

      tg.next()
      vi.advanceTimersByTime(200)
      onStepChange.mockClear()

      tg.prev()
      vi.advanceTimersByTime(200)

      expect(onStepChange).toHaveBeenCalledWith(trail.steps[0], 0)
    })

    it('is a no-op at step 0', async () => {
      const onStepChange = vi.fn()
      const tg = new Trailguide({ onStepChange })
      tg.start(buildTour(2))

      vi.advanceTimersByTime(200)
      onStepChange.mockClear()

      tg.prev()
      vi.advanceTimersByTime(200)

      expect(onStepChange).not.toHaveBeenCalled()
    })
  })

  describe('skip()', () => {
    it('emits trail_skipped, removes DOM, calls onSkip', () => {
      const onSkip = vi.fn()
      const tg = new Trailguide({ onSkip })
      tg.start(buildTour(2))

      tg.skip()

      expect(onSkip).toHaveBeenCalled()
      expect(document.querySelector('.trailguide-overlay')).toBeNull()
    })
  })

  describe('goToStep()', () => {
    it('jumps to specified step', async () => {
      const onStepChange = vi.fn()
      const tg = new Trailguide({ onStepChange })
      const trail = buildTour(3)
      tg.start(trail)

      tg.goToStep(2)
      vi.advanceTimersByTime(200)

      expect(onStepChange).toHaveBeenCalledWith(trail.steps[2], 2)
    })

    it('is a no-op for out-of-bounds index', async () => {
      const onStepChange = vi.fn()
      const tg = new Trailguide({ onStepChange })
      tg.start(buildTour(2))
      vi.advanceTimersByTime(200)
      onStepChange.mockClear()

      tg.goToStep(99)
      vi.advanceTimersByTime(200)

      expect(onStepChange).not.toHaveBeenCalled()
    })
  })

  describe('100ms guard', () => {
    it('stops tour during 100ms delay → onStepChange for next step not fired', () => {
      const onStepChange = vi.fn()
      const tg = new Trailguide({ onStepChange })
      const trail = buildTour(2)
      tg.start(trail)

      // Advance past first step's timer
      vi.advanceTimersByTime(200)
      onStepChange.mockClear()

      // Call next() to start transition to step 1
      tg.next()

      // Stop BEFORE the 100ms timer fires
      tg.stop()

      // Advance timers — the guard should prevent the step change callback
      vi.advanceTimersByTime(200)

      // onStepChange for step 1 should NOT have been called
      expect(onStepChange).not.toHaveBeenCalledWith(trail.steps[1], 1)
    })
  })

  describe('optional steps', () => {
    it('silently skips optional step with missing element', async () => {
      const onStepChange = vi.fn()

      appendElement('target-opt-0')
      appendElement('target-opt-2')

      const trail = makeTrail({
        steps: [
          makeStep({ id: 'opt-0', target: '#target-opt-0' }),
          makeStep({ id: 'opt-1', target: '#missing-opt', optional: true }),
          makeStep({ id: 'opt-2', target: '#target-opt-2' }),
        ],
      })

      const tg = new Trailguide({ onStepChange })
      tg.start(trail)

      // Advance to show step 0
      vi.advanceTimersByTime(200)
      onStepChange.mockClear()

      // next() → attempts step 1 (optional, missing) → skips to step 2
      tg.next()
      vi.advanceTimersByTime(200)

      expect(onStepChange).toHaveBeenCalledWith(trail.steps[2], 2)
    })

    it('completes when last step is optional and missing', async () => {
      const onComplete = vi.fn()

      appendElement('target-last-opt-0')

      const trail = makeTrail({
        steps: [
          makeStep({ id: 'lo-0', target: '#target-last-opt-0' }),
          makeStep({ id: 'lo-1', target: '#missing-last-opt', optional: true }),
        ],
      })

      const tg = new Trailguide({ onComplete })
      tg.start(trail)
      vi.advanceTimersByTime(200)

      // next() → attempts step 1 (optional, missing, last) → completes
      tg.next()

      expect(onComplete).toHaveBeenCalled()
    })
  })

  describe('non-optional missing element', () => {
    it('shows error modal and calls onError', async () => {
      const onError = vi.fn()

      const trail = makeTrail({
        steps: [makeStep({ id: 'err-0', target: '#missing-non-optional' })],
      })

      const tg = new Trailguide({ onError })
      tg.start(trail)

      // showStep runs synchronously (no timer for missing element)
      expect(onError).toHaveBeenCalledWith(
        trail.steps[0],
        'element_not_found'
      )
    })
  })

  describe('keyboard navigation', () => {
    it('ArrowRight advances to next step', async () => {
      const onStepChange = vi.fn()
      const tg = new Trailguide({ onStepChange })
      const trail = buildTour(2)
      tg.start(trail)

      vi.advanceTimersByTime(200)
      onStepChange.mockClear()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      vi.advanceTimersByTime(200)

      expect(onStepChange).toHaveBeenCalledWith(trail.steps[1], 1)
    })

    it('Enter advances to next step', async () => {
      const onStepChange = vi.fn()
      const tg = new Trailguide({ onStepChange })
      const trail = buildTour(2)
      tg.start(trail)

      vi.advanceTimersByTime(200)
      onStepChange.mockClear()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      vi.advanceTimersByTime(200)

      expect(onStepChange).toHaveBeenCalledWith(trail.steps[1], 1)
    })

    it('ArrowLeft goes to previous step', async () => {
      const onStepChange = vi.fn()
      const tg = new Trailguide({ onStepChange })
      const trail = buildTour(2)
      tg.start(trail)

      tg.next()
      vi.advanceTimersByTime(200)
      onStepChange.mockClear()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      vi.advanceTimersByTime(200)

      expect(onStepChange).toHaveBeenCalledWith(trail.steps[0], 0)
    })

    it('Escape skips the tour', () => {
      const onSkip = vi.fn()
      const tg = new Trailguide({ onSkip })
      tg.start(buildTour(2))

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(onSkip).toHaveBeenCalled()
    })
  })
})

describe('module-level start()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    stop() // Ensure clean state
  })

  afterEach(() => {
    stop()
    vi.useRealTimers()
  })

  it('second call stops prior instance first', () => {
    appendElement('mod-target-0')
    appendElement('mod-target-1')

    const trail1 = makeTrail({ steps: [makeStep({ target: '#mod-target-0' })] })
    const trail2 = makeTrail({ steps: [makeStep({ target: '#mod-target-1' })] })

    const instance1 = start(trail1)
    start(trail2)

    // After second start, only one overlay should exist
    expect(document.querySelectorAll('.trailguide-overlay').length).toBe(1)
    expect(start(trail1)).not.toBe(instance1)
  })
})
