// Re-export core types
export type {
  Trail,
  Step,
  Placement,
  TrailguideOptions,
  AnalyticsConfig,
} from '@trailguide/core';

// Re-export core utilities
export {
  findElement,
  isElementVisible,
  scrollToElement,
} from '@trailguide/core';

// React-specific exports
export { Trailguide } from './components/Trailguide';
export type { TrailguideProps } from './components/Trailguide';
export { useTrail } from './hooks/useTrail';
export type { UseTrailOptions, UseTrailReturn } from './hooks/useTrail';
