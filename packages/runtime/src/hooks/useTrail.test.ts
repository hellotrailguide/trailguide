import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTrail } from './useTrail'
import type { Trail } from '@trailguide/core'

// Mock the Trailguide class from @trailguide/core
const mockInstance = {
  start: vi.fn(),
  stop: vi.fn(),
  next: vi.fn(),
  prev: vi.fn(),
  skip: vi.fn(),
  goToStep: vi.fn(),
}

vi.mock('@trailguide/core', async (orig) => {
  const actual = await orig<typeof import('@trailguide/core')>()
  return {
    ...actual,
    Trailguide: vi.fn(() => mockInstance),
  }
})

const sampleTrail: Trail = {
  id: 'trail-1',
  title: 'Sample Trail',
  version: '1.0.0',
  steps: [
    { id: 'step-0', target: '#a', placement: 'bottom', title: 'Step 0', content: 'c0' },
    { id: 'step-1', target: '#b', placement: 'top', title: 'Step 1', content: 'c1' },
  ],
}

describe('useTrail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('autoStart:false', () => {
    it('does NOT call instance.start on mount', () => {
      renderHook(() => useTrail({ trail: sampleTrail, autoStart: false }))
      expect(mockInstance.start).not.toHaveBeenCalled()
    })

    it('starts with isActive:false', () => {
      const { result } = renderHook(() => useTrail({ trail: sampleTrail }))
      expect(result.current.isActive).toBe(false)
    })
  })

  describe('autoStart:true', () => {
    it('calls instance.start with trail on mount', () => {
      renderHook(() => useTrail({ trail: sampleTrail, autoStart: true }))
      expect(mockInstance.start).toHaveBeenCalledWith(sampleTrail)
    })

    it('isActive is true after autoStart', () => {
      const { result } = renderHook(() => useTrail({ trail: sampleTrail, autoStart: true }))
      expect(result.current.isActive).toBe(true)
    })
  })

  describe('start() / stop()', () => {
    it('start() delegates to instance.start and sets isActive:true', () => {
      const { result } = renderHook(() => useTrail({ trail: sampleTrail }))
      act(() => { result.current.start() })
      expect(mockInstance.start).toHaveBeenCalledWith(sampleTrail)
      expect(result.current.isActive).toBe(true)
    })

    it('stop() delegates to instance.stop and sets isActive:false', () => {
      const { result } = renderHook(() => useTrail({ trail: sampleTrail, autoStart: true }))
      act(() => { result.current.stop() })
      expect(mockInstance.stop).toHaveBeenCalled()
      expect(result.current.isActive).toBe(false)
    })
  })

  describe('navigation delegates', () => {
    it('next() calls instance.next', () => {
      const { result } = renderHook(() => useTrail({ trail: sampleTrail }))
      act(() => { result.current.next() })
      expect(mockInstance.next).toHaveBeenCalled()
    })

    it('prev() calls instance.prev', () => {
      const { result } = renderHook(() => useTrail({ trail: sampleTrail }))
      act(() => { result.current.prev() })
      expect(mockInstance.prev).toHaveBeenCalled()
    })

    it('skip() calls instance.skip', () => {
      const { result } = renderHook(() => useTrail({ trail: sampleTrail }))
      act(() => { result.current.skip() })
      expect(mockInstance.skip).toHaveBeenCalled()
    })

    it('goToStep(n) calls instance.goToStep(n)', () => {
      const { result } = renderHook(() => useTrail({ trail: sampleTrail }))
      act(() => { result.current.goToStep(1) })
      expect(mockInstance.goToStep).toHaveBeenCalledWith(1)
    })
  })

  describe('callback refs (stale closure test)', () => {
    it('calls the latest onComplete callback when ref is updated', async () => {
      // Verify the callback ref pattern by testing that rerenders don't cause
      // re-initialization of the Trailguide instance (which would break the ref pattern)
      const onComplete1 = vi.fn()
      const onComplete2 = vi.fn()

      const { rerender } = renderHook(
        ({ cb }) => useTrail({ trail: sampleTrail, onComplete: cb }),
        { initialProps: { cb: onComplete1 } }
      )

      // Rerender with new callback - should NOT create new instance
      const callsBefore = vi.mocked(
        (await import('@trailguide/core')).Trailguide
      ).mock.calls.length

      rerender({ cb: onComplete2 })

      const callsAfter = vi.mocked(
        (await import('@trailguide/core')).Trailguide
      ).mock.calls.length

      // The effect only re-runs when trail or analytics changes, not when callbacks change
      // So no new instance should be created
      expect(callsAfter).toBe(callsBefore)
    })
  })

  describe('cleanup', () => {
    it('calls instance.stop on unmount', () => {
      const { unmount } = renderHook(() => useTrail({ trail: sampleTrail }))
      unmount()
      expect(mockInstance.stop).toHaveBeenCalled()
    })
  })
})
