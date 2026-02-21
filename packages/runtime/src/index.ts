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
  tourStorage,
} from '@trailguide/core';

// React components
export { Trailguide } from './components/Trailguide';
export type { TrailguideProps } from './components/Trailguide';

// Hooks
export { useTrail } from './hooks/useTrail';
export type { UseTrailOptions, UseTrailReturn } from './hooks/useTrail';

export { useTrailManager } from './hooks/useTrailManager';
export type { UseTrailManagerOptions, UseTrailManagerReturn } from './hooks/useTrailManager';

// Tour registry — for help menu / persistent trigger integration
export {
  TourRegistryProvider,
  useTourRegistry,
  useRegisterTour,
} from './context/TourRegistryContext';
