import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRecorder } from './useRecorder'

// Mock the utils
vi.mock('../utils/selectorGenerator', () => ({
  generateSelector: vi.fn(() => '#mocked-selector'),
  highlightElement: vi.fn(() => vi.fn()),
}))

// Mock URL.createObjectURL and revokeObjectURL
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock'),
  revokeObjectURL: vi.fn(),
})

describe('useRecorder', () => {
  describe('initial state', () => {
    it('starts with isRecording:false, steps:[], pendingStep:null', () => {
      const { result } = renderHook(() => useRecorder())
      expect(result.current.isRecording).toBe(false)
      expect(result.current.steps).toHaveLength(0)
      expect(result.current.pendingStep).toBeNull()
    })
  })

  describe('recording controls', () => {
    it('startRecording sets isRecording to true', () => {
      const { result } = renderHook(() => useRecorder())
      act(() => { result.current.startRecording() })
      expect(result.current.isRecording).toBe(true)
    })

    it('stopRecording sets isRecording to false', () => {
      const { result } = renderHook(() => useRecorder())
      act(() => { result.current.startRecording() })
      act(() => { result.current.stopRecording() })
      expect(result.current.isRecording).toBe(false)
    })

    it('toggleRecording toggles state', () => {
      const { result } = renderHook(() => useRecorder())
      act(() => { result.current.toggleRecording() })
      expect(result.current.isRecording).toBe(true)
      act(() => { result.current.toggleRecording() })
      expect(result.current.isRecording).toBe(false)
    })
  })

  describe('click recording', () => {
    it('sets pendingStep with selector on click while recording', () => {
      const { result } = renderHook(() => useRecorder())

      act(() => { result.current.startRecording() })

      const target = document.createElement('div')
      target.id = 'click-target'
      document.body.appendChild(target)

      act(() => {
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      })

      expect(result.current.pendingStep).not.toBeNull()
      expect(result.current.pendingStep?.selector).toBe('#mocked-selector')
    })

    it('ignores clicks on [data-recorder-ui] elements', () => {
      const { result } = renderHook(() => useRecorder())

      act(() => { result.current.startRecording() })

      const uiEl = document.createElement('div')
      uiEl.setAttribute('data-recorder-ui', 'true')
      document.body.appendChild(uiEl)

      act(() => {
        uiEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      })

      expect(result.current.pendingStep).toBeNull()
    })
  })

  describe('confirmPendingStep', () => {
    it('adds step and clears pendingStep', () => {
      const { result } = renderHook(() => useRecorder())

      act(() => { result.current.startRecording() })

      const target = document.createElement('button')
      document.body.appendChild(target)

      act(() => {
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      })

      act(() => {
        result.current.confirmPendingStep({
          title: 'My Step',
          content: 'Step content',
          placement: 'bottom',
        })
      })

      expect(result.current.steps).toHaveLength(1)
      expect(result.current.steps[0].title).toBe('My Step')
      expect(result.current.steps[0].target).toBe('#mocked-selector')
      expect(result.current.pendingStep).toBeNull()
    })
  })

  describe('cancelPendingStep', () => {
    it('clears pendingStep without adding step', () => {
      const { result } = renderHook(() => useRecorder())

      act(() => { result.current.startRecording() })

      const target = document.createElement('div')
      document.body.appendChild(target)

      act(() => {
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      })

      expect(result.current.pendingStep).not.toBeNull()

      act(() => { result.current.cancelPendingStep() })

      expect(result.current.pendingStep).toBeNull()
      expect(result.current.steps).toHaveLength(0)
    })
  })

  describe('step management', () => {
    it('addStep adds a step with auto-generated id', () => {
      const { result } = renderHook(() => useRecorder())
      act(() => {
        result.current.addStep({ target: '#el', placement: 'bottom', title: 'T', content: 'C' })
      })
      expect(result.current.steps).toHaveLength(1)
      expect(result.current.steps[0].id).toBeTruthy()
    })

    it('removeStep removes step at index', () => {
      const { result } = renderHook(() => useRecorder())
      act(() => {
        result.current.addStep({ target: '#a', placement: 'bottom', title: 'A', content: '' })
        result.current.addStep({ target: '#b', placement: 'top', title: 'B', content: '' })
      })
      act(() => { result.current.removeStep(0) })
      expect(result.current.steps).toHaveLength(1)
      expect(result.current.steps[0].title).toBe('B')
    })

    it('updateStep updates specific step fields', () => {
      const { result } = renderHook(() => useRecorder())
      act(() => {
        result.current.addStep({ target: '#x', placement: 'bottom', title: 'Old', content: 'Old' })
      })
      act(() => { result.current.updateStep(0, { title: 'New' }) })
      expect(result.current.steps[0].title).toBe('New')
    })

    it('clearSteps empties the steps array', () => {
      const { result } = renderHook(() => useRecorder())
      act(() => {
        result.current.addStep({ target: '#a', placement: 'bottom', title: 'A', content: '' })
        result.current.addStep({ target: '#b', placement: 'top', title: 'B', content: '' })
      })
      act(() => { result.current.clearSteps() })
      expect(result.current.steps).toHaveLength(0)
    })
  })

  describe('exportTrail', () => {
    it('returns correct Trail shape', () => {
      const { result } = renderHook(() =>
        useRecorder({ trailId: 'my-trail', trailTitle: 'My Trail' })
      )
      act(() => {
        result.current.addStep({ target: '#a', placement: 'bottom', title: 'A', content: 'C' })
      })

      const trail = result.current.exportTrail()
      expect(trail.id).toBe('my-trail')
      expect(trail.title).toBe('My Trail')
      expect(trail.version).toBe('1.0.0')
      expect(trail.steps).toHaveLength(1)
    })
  })

  describe('downloadTrail', () => {
    it('calls createObjectURL and revokeObjectURL', () => {
      const { result } = renderHook(() => useRecorder())
      act(() => {
        result.current.addStep({ target: '#a', placement: 'bottom', title: 'A', content: 'C' })
      })

      // Mock link click
      const originalCreate = document.createElement.bind(document)
      const mockClick = vi.fn()
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreate(tag)
        if (tag === 'a') {
          Object.defineProperty(el, 'click', { value: mockClick, writable: true })
        }
        return el
      })

      act(() => { result.current.downloadTrail('trail.json') })

      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
      expect(mockClick).toHaveBeenCalled()

      vi.restoreAllMocks()
    })
  })
})
