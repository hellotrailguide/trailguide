export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface Step {
  id: string;
  target: string;
  placement: Placement;
  title: string;
  content: string;
  /** When true, silently skip this step if the target element is not found or not visible */
  optional?: boolean;
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
