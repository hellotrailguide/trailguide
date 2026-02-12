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

  useEffect(() => {
    // Create instance and start
    instanceRef.current = new TrailguideCore({
      onComplete,
      onStepChange,
      onSkip,
      analytics,
    });

    instanceRef.current.start(trail);

    // Cleanup on unmount
    return () => {
      instanceRef.current?.stop();
    };
  }, [trail, onComplete, onStepChange, onSkip, analytics]);

  // This component doesn't render anything - the core handles DOM
  return null;
}
