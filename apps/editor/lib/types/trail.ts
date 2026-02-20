// Trail types - inlined from @trailguide/core for deployment compatibility

export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface Step {
  id: string;
  target: string;
  placement: Placement;
  title: string;
  content: string;
}

export interface Trail {
  id: string;
  title: string;
  version: string;
  steps: Step[];
}

export interface ElementRect { x: number; y: number; width: number; height: number }

export interface TrailguideOptions {
  onComplete?: () => void;
  onSkip?: () => void;
  onStepChange?: (step: Step, index: number) => void;
}
