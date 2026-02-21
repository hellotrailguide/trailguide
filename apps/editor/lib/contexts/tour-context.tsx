'use client'

import { createContext, useContext, useRef, useCallback } from 'react'

interface TourContextValue {
  startTour: () => void
  registerTour: (fn: () => void) => () => void
}

const TourContext = createContext<TourContextValue>({
  startTour: () => {},
  registerTour: () => () => {},
})

export function TourProvider({ children }: { children: React.ReactNode }) {
  const startRef = useRef<(() => void) | null>(null)

  const registerTour = useCallback((fn: () => void) => {
    startRef.current = fn
    return () => {
      if (startRef.current === fn) startRef.current = null
    }
  }, [])

  const startTour = useCallback(() => {
    startRef.current?.()
  }, [])

  return (
    <TourContext.Provider value={{ startTour, registerTour }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTourContext() {
  return useContext(TourContext)
}
