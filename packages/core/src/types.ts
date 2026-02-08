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

export interface AnalyticsConfig {
  endpoint: string;      // e.g., 'https://app.gettrailguide.com/api/analytics'
  userId: string;        // Trail owner's user ID (from Pro Editor)
  trailId?: string;      // Override trail.id if needed
  debug?: boolean;       // Log events to console
}

export interface TrailguideOptions {
  onComplete?: () => void;
  onSkip?: () => void;
  onStepChange?: (step: Step, index: number) => void;
  analytics?: AnalyticsConfig;
}

export interface TrailguideState {
  trail: Trail | null;
  currentStepIndex: number;
  isActive: boolean;
}
