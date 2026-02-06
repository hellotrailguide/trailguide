export type Placement = 'top' | 'bottom' | 'left' | 'right';

export type StepAction = 'click' | 'input' | 'hover' | 'none';

export type NextTrigger = 'click' | 'manual';

export interface Step {
  id: string;
  target: string;
  placement: Placement;
  title: string;
  content: string;
  action?: StepAction;
  nextOn?: NextTrigger;
}

export interface Trail {
  id: string;
  title: string;
  version: string;
  steps: Step[];
}

export interface TrailguideOptions {
  onComplete?: () => void;
  onSkip?: () => void;
  onStepChange?: (step: Step, index: number) => void;
}

export interface TrailguideState {
  trail: Trail | null;
  currentStepIndex: number;
  isActive: boolean;
}
