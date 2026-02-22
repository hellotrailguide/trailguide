import { describe, it, expect, vi } from 'vitest'
import { tourStorage } from './storage'

describe('tourStorage', () => {
  describe('hasCompleted / markCompleted', () => {
    it('returns false before marking', () => {
      expect(tourStorage.hasCompleted('trail-1')).toBe(false)
    })

    it('returns true after marking completed', () => {
      tourStorage.markCompleted('trail-1')
      expect(tourStorage.hasCompleted('trail-1')).toBe(true)
    })

    it('stores under correct key', () => {
      tourStorage.markCompleted('my-trail')
      expect(localStorage.getItem('trailguide:completed:my-trail')).toBe('true')
    })
  })

  describe('getProgress / saveProgress', () => {
    it('returns null for missing key', () => {
      expect(tourStorage.getProgress('unknown-trail')).toBeNull()
    })

    it('returns null for non-numeric value', () => {
      localStorage.setItem('trailguide:progress:bad-trail', 'not-a-number')
      expect(tourStorage.getProgress('bad-trail')).toBeNull()
    })

    it('round-trips progress as integer', () => {
      tourStorage.saveProgress('trail-2', 3)
      expect(tourStorage.getProgress('trail-2')).toBe(3)
    })

    it('returns 0 when progress is 0', () => {
      tourStorage.saveProgress('trail-zero', 0)
      expect(tourStorage.getProgress('trail-zero')).toBe(0)
    })
  })

  describe('clearProgress', () => {
    it('removes progress key but keeps completion key', () => {
      tourStorage.markCompleted('trail-3')
      tourStorage.saveProgress('trail-3', 2)

      tourStorage.clearProgress('trail-3')

      expect(tourStorage.getProgress('trail-3')).toBeNull()
      expect(tourStorage.hasCompleted('trail-3')).toBe(true)
    })
  })

  describe('reset', () => {
    it('removes both completion and progress keys', () => {
      tourStorage.markCompleted('trail-4')
      tourStorage.saveProgress('trail-4', 1)

      tourStorage.reset('trail-4')

      expect(tourStorage.hasCompleted('trail-4')).toBe(false)
      expect(tourStorage.getProgress('trail-4')).toBeNull()
    })
  })

  describe('resetAll', () => {
    it('removes all trailguide: keys', () => {
      tourStorage.markCompleted('trail-5')
      tourStorage.saveProgress('trail-5', 2)
      tourStorage.markCompleted('trail-6')

      tourStorage.resetAll()

      expect(localStorage.getItem('trailguide:completed:trail-5')).toBeNull()
      expect(localStorage.getItem('trailguide:progress:trail-5')).toBeNull()
      expect(localStorage.getItem('trailguide:completed:trail-6')).toBeNull()
    })

    it('leaves unrelated keys intact', () => {
      localStorage.setItem('my-app:setting', 'value')
      tourStorage.markCompleted('trail-7')

      tourStorage.resetAll()

      expect(localStorage.getItem('my-app:setting')).toBe('value')
    })
  })

  describe('SSR safety', () => {
    it('hasCompleted returns false when window is undefined', () => {
      vi.stubGlobal('window', undefined)
      expect(() => tourStorage.hasCompleted('trail-ssr')).not.toThrow()
      expect(tourStorage.hasCompleted('trail-ssr')).toBe(false)
      vi.unstubAllGlobals()
    })

    it('getProgress returns null when window is undefined', () => {
      vi.stubGlobal('window', undefined)
      expect(tourStorage.getProgress('trail-ssr')).toBeNull()
      vi.unstubAllGlobals()
    })

    it('markCompleted silently returns when window is undefined', () => {
      vi.stubGlobal('window', undefined)
      expect(() => tourStorage.markCompleted('trail-ssr')).not.toThrow()
      vi.unstubAllGlobals()
    })

    it('resetAll silently returns when window is undefined', () => {
      vi.stubGlobal('window', undefined)
      expect(() => tourStorage.resetAll()).not.toThrow()
      vi.unstubAllGlobals()
    })
  })
})
