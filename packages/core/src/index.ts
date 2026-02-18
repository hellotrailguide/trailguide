import './styles.css';

export { Trailguide, start, stop, next, prev, skip } from './trailguide';

export type {
  Trail,
  Step,
  Placement,
  StepAction,
  NextTrigger,
  TrailguideOptions,
  TrailguideState,
  AnalyticsConfig,
} from './types';

export type {
  AnalyticsEvent,
  AnalyticsEventType,
} from './analytics';

export {
  findElement,
  isElementVisible,
  scrollToElement,
} from './dom';

export { theme } from './theme';

// Validation utilities
export {
  validateTrail,
  logValidationResults,
} from './validate';

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './validate';
