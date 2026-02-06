// Components
export { RecorderOverlay } from './components/RecorderOverlay';
export { StepForm } from './components/StepForm';

// Hooks
export { useRecorder } from './hooks/useRecorder';
export type { UseRecorderOptions, UseRecorderReturn, PendingStep } from './hooks/useRecorder';

// Utils
export {
  generateSelector,
  validateSelector,
  highlightElement,
} from './utils/selectorGenerator';
