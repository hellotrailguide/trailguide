export type Placement = 'top' | 'bottom' | 'left' | 'right';

export type TrailMode = 'tour' | 'test' | 'both';

export type StepAction = 'click' | 'fill' | 'select' | 'check' | 'hover';

export interface StepAssert {
  type: 'visible' | 'hidden' | 'text' | 'value' | 'url';
  expected?: string;
}

export interface Step {
  id: string;
  target: string;
  placement: Placement;
  title: string;
  content: string;
  /** When true, silently skip this step if the target element is not found or not visible */
  optional?: boolean;
  /** URL or pathname this step belongs to (e.g. '/dashboard'). Used to resume cross-page tours. */
  url?: string;
  /** Action to execute on the target element when running as a test */
  action?: StepAction;
  /** Value for fill/select actions */
  value?: string;
  /** Assertion to run after the action */
  assert?: StepAssert;
}

export interface Trail {
  id: string;
  title: string;
  version: string;
  steps: Step[];
  /** Whether this trail runs as a guide, a Playwright test, or both. Defaults to 'tour'. */
  mode?: TrailMode;
}

export interface AnalyticsConfig {
  endpoint: string;      // e.g., 'https://app.gettrailguide.com/api/analytics'
  userId: string;        // Trail owner's user ID (from Pro Editor)
  trailId?: string;      // Override trail.id if needed
  debug?: boolean;       // Log events to console
}

export interface TrailguideOptions {
  theme?: 'light' | 'dark';
  onComplete?: () => void;
  onSkip?: () => void;
  /** Fires when stop() is called while a tour is still active (e.g. user navigates away) */
  onAbandoned?: () => void;
  onStepChange?: (step: Step, index: number) => void;
  /** Fires when a step's target element cannot be found or is not visible */
  onError?: (step: Step, error: 'element_not_found' | 'element_not_visible') => void;
  analytics?: AnalyticsConfig;
}
