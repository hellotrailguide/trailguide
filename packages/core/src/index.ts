import './styles.css';

export { Trailguide, start, stop, next, prev, skip, resume } from './trailguide';

export type {
  Trail,
  Step,
  Placement,
  TrailMode,
  StepAction,
  StepAssert,
  TrailguideOptions,
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

// Storage utilities
export { tourStorage } from './storage';

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './validate';
