import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTrailManager } from './useTrailManager'
import type { Trail } from '@trailguide/core'

// Use vi.hoisted to ensure these are available when vi.mock factories are called
const { mockInstance, mockTourStorage } = vi.hoisted(() => {
  const mockInstance = {
    start: vi.fn(),
    stop: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    skip: vi.fn(),
    goToStep: vi.fn(),
  }
  const mockTourStorage = {
    hasCompleted: vi.fn(() => false),
    markCompleted: vi.fn(),
    getProgress: vi.fn(() => null as number | null),
    saveProgress: vi.fn(),
    clearProgress: vi.fn(),
    reset: vi.fn(),
    resetAll: vi.fn(),
  }
  return { mockInstance, mockTourStorage }
})

vi.mock('@trailguide/core', async (orig) => {
  const actual = await orig<typeof import('@trailguide/core')>()
  return {
    ...actual,
    Trailguide: vi.fn(() => mockInstance),
    tourStorage: mockTourStorage,
  }
})

const sampleTrail: Trail = {
  id: 'managed-trail',
  title: 'Managed Trail',
  version: '1.0.0',
  steps: [
    { id: 's0', target: '#a', placement: 'bottom', title: 'Step 0', content: 'c0' },
    { id: 's1', target: '#b', placement: 'top', title: 'Step 1', content: 'c1' },
  ],
}

describe('useTrailManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockTourStorage.hasCompleted.mockReturnValue(false)
    mockTourStorage.getProgress.mockReturnValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('auto-show behavior', () => {
    it('auto-shows after default 500ms delay when once:true and not completed', async () => {
      mockTourStorage.hasCompleted.mockReturnValue(false)

      renderHook(() =>
        useTrailManager(sampleTrail, { once: true, delay: 500 })
      )

      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      expect(mockInstance.start).toHaveBeenCalled()
    })

    it('does NOT auto-show when once:true and already completed', async () => {
      mockTourStorage.hasCompleted.mockReturnValue(true)

      renderHook(() => useTrailManager(sampleTrail, { once: true }))

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(mockInstance.start).not.toHaveBeenCalled()
    })

    it('does NOT auto-show when enabled:false', async () => {
      renderHook(() => useTrailManager(sampleTrail, { enabled: false }))

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(mockInstance.start).not.toHaveBeenCalled()
    })

    it('auto-shows after custom delay:200ms', async () => {
      renderHook(() => useTrailManager(sampleTrail, { delay: 200 }))

      await act(async () => { vi.advanceTimersByTime(199) })
      expect(mockInstance.start).not.toHaveBeenCalled()

      await act(async () => { vi.advanceTimersByTime(1) })
      expect(mockInstance.start).toHaveBeenCalled()
    })
  })

  describe('show() with resumable', () => {
    it('calls goToStep with saved progress when resumable:true', async () => {
      mockTourStorage.getProgress.mockReturnValue(2)

      const { result } = renderHook(() =>
        useTrailManager(sampleTrail, { resumable: true, enabled: false })
      )

      act(() => { result.current.show() })

      expect(mockInstance.goToStep).toHaveBeenCalledWith(2)
    })
  })

  describe('dismiss()', () => {
    it('calls markCompleted when once:true', () => {
      const { result } = renderHook(() =>
        useTrailManager(sampleTrail, { once: true, enabled: false })
      )

      act(() => { result.current.dismiss() })

      expect(mockTourStorage.markCompleted).toHaveBeenCalledWith(
        'trailguide:managed:managed-trail'
      )
    })

    it('calls instance.stop', () => {
      const { result } = renderHook(() =>
        useTrailManager(sampleTrail, { enabled: false })
      )

      act(() => { result.current.dismiss() })

      expect(mockInstance.stop).toHaveBeenCalled()
    })
  })

  describe('reset()', () => {
    it('calls tourStorage.reset with resolved key', () => {
      const { result } = renderHook(() =>
        useTrailManager(sampleTrail, { enabled: false })
      )

      act(() => { result.current.reset() })

      expect(mockTourStorage.reset).toHaveBeenCalledWith(
        'trailguide:managed:managed-trail'
      )
    })

    it('uses custom storageKey when provided', () => {
      const { result } = renderHook(() =>
        useTrailManager(sampleTrail, { enabled: false, storageKey: 'my-custom-key' })
      )

      act(() => { result.current.reset() })

      expect(mockTourStorage.reset).toHaveBeenCalledWith('my-custom-key')
    })
  })

  describe('onStepChange + resumable', () => {
    it('calls saveProgress with key and index on each step change', async () => {
      const { Trailguide: MockTG } = await import('@trailguide/core')
      let capturedOnStepChange: ((step: unknown, index: number) => void) | undefined

      vi.mocked(MockTG).mockImplementationOnce((opts: { onStepChange?: (step: unknown, index: number) => void }) => {
        capturedOnStepChange = opts.onStepChange
        return mockInstance
      })

      renderHook(() =>
        useTrailManager(sampleTrail, {
          resumable: true,
          enabled: false,
          storageKey: 'test-progress-key',
        })
      )

      act(() => { capturedOnStepChange?.(sampleTrail.steps[1], 1) })

      expect(mockTourStorage.saveProgress).toHaveBeenCalledWith('test-progress-key', 1)
    })
  })

  describe('cleanup', () => {
    it('calls instance.stop on unmount', () => {
      const { unmount } = renderHook(() =>
        useTrailManager(sampleTrail, { enabled: false })
      )

      unmount()

      expect(mockInstance.stop).toHaveBeenCalled()
    })
  })
})
