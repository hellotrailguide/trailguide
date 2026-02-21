import { useState, useEffect, useCallback, useRef } from 'react';
import { Trailguide as TrailguideCore, tourStorage } from '@trailguide/core';
import type { Trail, Step, AnalyticsConfig } from '@trailguide/core';

export interface UseTrailManagerOptions {
  /**
   * When true, the tour auto-shows on first visit and marks itself as seen
   * on completion or skip so it never auto-shows again.
   */
  once?: boolean;
  /**
   * localStorage key used to track completion and progress.
   * Defaults to `trailguide:managed:{trail.id}`.
   */
  storageKey?: string;
  /**
   * The tour only auto-shows when this is true.
   * Use this to gate on loading state, user tier, feature flags, etc.
   * The help menu can still trigger the tour regardless of this value.
   * @default true
   */
  enabled?: boolean;
  /** Delay in ms before the tour auto-shows on first visit. @default 500 */
  delay?: number;
  /**
   * When true, saves the user's progress on each step so they resume
   * where they left off if they navigate away mid-tour.
   */
  resumable?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  /** Fires when the tour is stopped programmatically (e.g. user navigates away) */
  onAbandoned?: () => void;
  onStepChange?: (step: Step, index: number) => void;
  /** Fires when a step's target element is not found or not visible */
  onError?: (step: Step, error: 'element_not_found' | 'element_not_visible') => void;
  analytics?: AnalyticsConfig;
}

export interface UseTrailManagerReturn {
  isActive: boolean;
  currentStep: Step | null;
  currentStepIndex: number;
  totalSteps: number;
  /** Show the tour (optionally resuming from saved progress) */
  show: () => void;
  /** Hide the tour and, if once:true, mark it as completed */
  dismiss: () => void;
  /** Clear all saved state for this tour so it will auto-show again */
  reset: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  goToStep: (index: number) => void;
}

export function useTrailManager(
  trail: Trail,
  options: UseTrailManagerOptions = {}
): UseTrailManagerReturn {
  const {
    once = false,
    storageKey,
    enabled = true,
    delay = 500,
    resumable = false,
    analytics,
  } = options;

  const resolvedKey = storageKey ?? `trailguide:managed:${trail.id}`;

  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const instanceRef = useRef<TrailguideCore | null>(null);

  // Stable callback refs — updated every render, no effect re-runs
  const onCompleteRef = useRef(options.onComplete);
  const onSkipRef = useRef(options.onSkip);
  const onAbandonedRef = useRef(options.onAbandoned);
  const onStepChangeRef = useRef(options.onStepChange);
  const onErrorRef = useRef(options.onError);
  onCompleteRef.current = options.onComplete;
  onSkipRef.current = options.onSkip;
  onAbandonedRef.current = options.onAbandoned;
  onStepChangeRef.current = options.onStepChange;
  onErrorRef.current = options.onError;

  const currentStep = isActive && trail.steps[currentStepIndex]
    ? trail.steps[currentStepIndex]
    : null;

  // Create the core instance
  useEffect(() => {
    instanceRef.current = new TrailguideCore({
      onComplete: () => {
        if (once) tourStorage.markCompleted(resolvedKey);
        if (resumable) tourStorage.clearProgress(resolvedKey);
        setIsActive(false);
        setCurrentStepIndex(0);
        onCompleteRef.current?.();
      },
      onSkip: () => {
        if (once) tourStorage.markCompleted(resolvedKey);
        if (resumable) tourStorage.clearProgress(resolvedKey);
        setIsActive(false);
        setCurrentStepIndex(0);
        onSkipRef.current?.();
      },
      onAbandoned: () => {
        setIsActive(false);
        onAbandonedRef.current?.();
      },
      onStepChange: (step, index) => {
        setCurrentStepIndex(index);
        if (resumable) tourStorage.saveProgress(resolvedKey, index);
        onStepChangeRef.current?.(step, index);
      },
      onError: (step, error) => {
        onErrorRef.current?.(step, error);
      },
      analytics,
    });

    return () => {
      instanceRef.current?.stop();
    };
  }, [trail, analytics, once, resolvedKey, resumable]);

  const show = useCallback(() => {
    if (!instanceRef.current) return;
    const startIndex = resumable ? (tourStorage.getProgress(resolvedKey) ?? 0) : 0;
    instanceRef.current.start(trail);
    if (startIndex > 0) instanceRef.current.goToStep(startIndex);
    setIsActive(true);
    setCurrentStepIndex(startIndex);
  }, [trail, resumable, resolvedKey]);

  // Stable ref so the auto-show effect always calls the latest show()
  const showRef = useRef(show);
  showRef.current = show;

  // Auto-show on first visit, re-evaluates when enabled/once/key/delay changes
  useEffect(() => {
    if (!enabled) return;
    if (once && tourStorage.hasCompleted(resolvedKey)) return;

    const t = setTimeout(() => showRef.current(), delay);
    return () => clearTimeout(t);
  }, [enabled, once, resolvedKey, delay]);

  const dismiss = useCallback(() => {
    if (once) tourStorage.markCompleted(resolvedKey);
    instanceRef.current?.stop();
    setIsActive(false);
    setCurrentStepIndex(0);
  }, [once, resolvedKey]);

  const reset = useCallback(() => {
    tourStorage.reset(resolvedKey);
  }, [resolvedKey]);

  const next = useCallback(() => instanceRef.current?.next(), []);
  const prev = useCallback(() => instanceRef.current?.prev(), []);
  const skip = useCallback(() => instanceRef.current?.skip(), []);
  const goToStep = useCallback((index: number) => instanceRef.current?.goToStep(index), []);

  return {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps: trail.steps.length,
    show,
    dismiss,
    reset,
    next,
    prev,
    skip,
    goToStep,
  };
}
