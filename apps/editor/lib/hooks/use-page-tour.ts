'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTourContext } from '@/lib/contexts/tour-context'

interface UsePageTourOptions {
  delay?: number
  /** Defer the first-visit auto-trigger until this is true (e.g. wait for data to load) */
  ready?: boolean
}

export function usePageTour(storageKey: string, options?: UsePageTourOptions) {
  const { delay = 500, ready = true } = options ?? {}
  const { registerTour } = useTourContext()
  const [showTour, setShowTour] = useState(false)

  const start = useCallback(() => setShowTour(true), [])

  // Register with context so the help menu can trigger this page's tour
  useEffect(() => {
    return registerTour(start)
  }, [registerTour, start])

  // Auto-trigger on first visit once the page is ready
  useEffect(() => {
    if (!ready) return
    const seen = localStorage.getItem(storageKey)
    if (!seen) {
      const t = setTimeout(() => setShowTour(true), delay)
      return () => clearTimeout(t)
    }
  }, [storageKey, delay, ready])

  const complete = useCallback(() => {
    localStorage.setItem(storageKey, 'true')
    setShowTour(false)
  }, [storageKey])

  return { showTour, complete }
}
