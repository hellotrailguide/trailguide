import { useEffect, useRef } from 'react';
import { Trailguide as TrailguideCore } from '@trailguide/core';
import type { Trail, Step, AnalyticsConfig } from '@trailguide/core';

// Note: Styles are bundled with @trailguide/core automatically

export interface TrailguideProps {
  trail: Trail;
  onComplete?: () => void;
  onStepChange?: (step: Step, index: number) => void;
  onSkip?: () => void;
  analytics?: AnalyticsConfig;
}

export function Trailguide({
  trail,
  onComplete,
  onStepChange,
  onSkip,
  analytics,
}: TrailguideProps) {
  const instanceRef = useRef<TrailguideCore | null>(null);

  // Store callbacks in refs so they don't cause effect re-runs
  const onCompleteRef = useRef(onComplete);
  const onStepChangeRef = useRef(onStepChange);
  const onSkipRef = useRef(onSkip);
  onCompleteRef.current = onComplete;
  onStepChangeRef.current = onStepChange;
  onSkipRef.current = onSkip;

  useEffect(() => {
    instanceRef.current = new TrailguideCore({
      onComplete: () => onCompleteRef.current?.(),
      onStepChange: (step, index) => onStepChangeRef.current?.(step, index),
      onSkip: () => onSkipRef.current?.(),
      analytics,
    });

    instanceRef.current.start(trail);

    return () => {
      instanceRef.current?.stop();
    };
  }, [trail, analytics]);

  // This component doesn't render anything - the core handles DOM
  return null;
}
