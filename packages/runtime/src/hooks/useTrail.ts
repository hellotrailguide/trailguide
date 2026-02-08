import { useState, useCallback, useEffect, useRef } from 'react';
import { Trailguide as TrailguideCore } from '@trailguide/core';
import type { Trail, Step, AnalyticsConfig } from '@trailguide/core';

export interface UseTrailOptions {
  trail: Trail;
  onComplete?: () => void;
  onStepChange?: (step: Step, index: number) => void;
  onSkip?: () => void;
  autoStart?: boolean;
  analytics?: AnalyticsConfig;
}

export interface UseTrailReturn {
  currentStep: Step | null;
  currentStepIndex: number;
  totalSteps: number;
  isActive: boolean;
  next: () => void;
  prev: () => void;
  skip: () => void;
  goToStep: (index: number) => void;
  start: () => void;
  stop: () => void;
}

export function useTrail({
  trail,
  onComplete,
  onStepChange,
  onSkip,
  autoStart = false,
  analytics,
}: UseTrailOptions): UseTrailReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const instanceRef = useRef<TrailguideCore | null>(null);

  const currentStep = isActive && trail.steps[currentStepIndex]
    ? trail.steps[currentStepIndex]
    : null;

  const totalSteps = trail.steps.length;

  // Create instance
  useEffect(() => {
    instanceRef.current = new TrailguideCore({
      onComplete: () => {
        setIsActive(false);
        onComplete?.();
      },
      onStepChange: (step, index) => {
        setCurrentStepIndex(index);
        onStepChange?.(step, index);
      },
      onSkip: () => {
        setIsActive(false);
        onSkip?.();
      },
      analytics,
    });

    if (autoStart) {
      instanceRef.current.start(trail);
      setIsActive(true);
    }

    return () => {
      instanceRef.current?.stop();
    };
  }, [trail, onComplete, onStepChange, onSkip, autoStart, analytics]);

  const start = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.start(trail);
      setIsActive(true);
      setCurrentStepIndex(0);
    }
  }, [trail]);

  const stop = useCallback(() => {
    instanceRef.current?.stop();
    setIsActive(false);
  }, []);

  const next = useCallback(() => {
    instanceRef.current?.next();
  }, []);

  const prev = useCallback(() => {
    instanceRef.current?.prev();
  }, []);

  const skip = useCallback(() => {
    instanceRef.current?.skip();
  }, []);

  const goToStep = useCallback((index: number) => {
    instanceRef.current?.goToStep(index);
  }, []);

  return {
    currentStep,
    currentStepIndex,
    totalSteps,
    isActive,
    next,
    prev,
    skip,
    goToStep,
    start,
    stop,
  };
}
