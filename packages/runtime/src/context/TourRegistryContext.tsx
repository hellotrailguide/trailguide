import { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import type { UseTrailManagerOptions, UseTrailManagerReturn } from '../hooks/useTrailManager';
import { useTrailManager } from '../hooks/useTrailManager';
import type { Trail } from '@trailguide/core';

interface TourRegistryContextValue {
  /**
   * Trigger the tour for whatever page/view is currently mounted.
   * Call this from a persistent help button, keyboard shortcut, etc.
   */
  startCurrentTour: () => void;
  /**
   * Register a tour start function for the currently active page.
   * Returns a cleanup function that deregisters on unmount.
   * You typically won't call this directly — use useRegisterTour instead.
   */
  registerTour: (startFn: () => void) => () => void;
}

const TourRegistryContext = createContext<TourRegistryContextValue>({
  startCurrentTour: () => {},
  registerTour: () => () => {},
});

/**
 * Wrap your app's persistent layout (sidebar, navbar) with this provider.
 * Wire your help button to `useTourRegistry().startCurrentTour()`.
 * Each page uses `useRegisterTour()` to register itself.
 */
export function TourRegistryProvider({ children }: { children: React.ReactNode }) {
  const startRef = useRef<(() => void) | null>(null);

  const registerTour = useCallback((startFn: () => void) => {
    startRef.current = startFn;
    return () => {
      if (startRef.current === startFn) startRef.current = null;
    };
  }, []);

  const startCurrentTour = useCallback(() => {
    startRef.current?.();
  }, []);

  return (
    <TourRegistryContext.Provider value={{ startCurrentTour, registerTour }}>
      {children}
    </TourRegistryContext.Provider>
  );
}

/** Access the registry from a help button or keyboard shortcut handler */
export function useTourRegistry() {
  return useContext(TourRegistryContext);
}

/**
 * Drop-in replacement for useTrailManager that also registers the tour
 * with the nearest TourRegistryProvider. The help menu will trigger
 * this tour whenever this page/view is mounted.
 *
 * @example
 * // In your page component:
 * const { isActive, dismiss } = useRegisterTour(MY_TOUR, { once: true })
 *
 * // In your layout's help button:
 * const { startCurrentTour } = useTourRegistry()
 * <button onClick={startCurrentTour}>Quick Start Tour</button>
 */
export function useRegisterTour(
  trail: Trail,
  options?: UseTrailManagerOptions
): UseTrailManagerReturn {
  const { registerTour } = useTourRegistry();
  const manager = useTrailManager(trail, options);

  // Keep a stable ref so the registered function doesn't change identity
  const showRef = useRef(manager.show);
  showRef.current = manager.show;

  useEffect(() => {
    return registerTour(() => showRef.current());
  }, [registerTour]);

  return manager;
}
