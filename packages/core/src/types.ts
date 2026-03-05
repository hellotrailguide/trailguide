export type Placement = 'top' | 'bottom' | 'left' | 'right';

export type TrailMode = 'tour' | 'test' | 'both';

export type StepAction =
  | 'click' | 'rightClick' | 'dblclick'
  | 'fill' | 'type' | 'select' | 'check' | 'uncheck' | 'hover' | 'focus'
  | 'press' | 'scroll' | 'dragTo' | 'setInputFiles' | 'goto' | 'evaluate';

export interface StepAssert {
  type:
    | 'visible' | 'hidden' | 'enabled' | 'disabled' | 'checked' | 'empty'
    | 'text' | 'containsText' | 'value' | 'url' | 'title'
    | 'attribute' | 'hasClass' | 'count'
    | 'screenshot' | 'custom';
  /** Expected value — text, URL, attribute value, count, class name, or JS expression for custom */
  expected?: string;
  /** Attribute name — required when type is 'attribute' */
  attribute?: string;
}

/** Step type — 'element' is the default (tooltip on a page element). 'celebration' and 'feedback' are full-screen overlay steps with no target element. */
export type StepType = 'element' | 'celebration' | 'feedback';

export interface CelebrationConfig {
  emoji?: string;
  showConfetti?: boolean;
  ctaLabel?: string;
}

export interface FeedbackConfig {
  /** Rating widget style */
  type: 'stars' | 'thumbs' | 'nps';
  question?: string;
  allowComment?: boolean;
  commentPlaceholder?: string;
  /** URL to POST { rating, comment, trailId, stepId } on submit */
  webhook?: string;
  ctaLabel?: string;
}

export interface StepWait {
  /** networkIdle: wait for no network requests for 500ms. load/domcontentloaded: wait for page load event. selector: wait for a CSS selector to appear. timeout: pause for N ms. */
  type: 'networkIdle' | 'load' | 'domcontentloaded' | 'selector' | 'timeout';
  /** CSS selector (for 'selector' type) or milliseconds (for 'timeout' type) */
  value?: string;
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
  /** Value for fill/type/select/press/scroll/evaluate actions */
  value?: string;
  /** Assertion to run after the action */
  assert?: StepAssert;
  /** Wait condition to apply before the next step */
  wait?: StepWait;
  /** When true, this step's action opens a new browser tab and subsequent steps run in that tab */
  opensNewTab?: boolean;
  /** Which tab context this step runs in. Omit for main tab. Set to 'new' for steps in an opened tab. */
  tabContext?: 'main' | 'new';
  /** Step type. Defaults to 'element'. 'celebration' and 'feedback' are full-screen overlay steps. */
  stepType?: StepType;
  /** Config for stepType: 'celebration' */
  celebration?: CelebrationConfig;
  /** Config for stepType: 'feedback' */
  feedback?: FeedbackConfig;
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
