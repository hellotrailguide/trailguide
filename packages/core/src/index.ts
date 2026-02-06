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
} from './types';

export {
  findElement,
  isElementVisible,
  scrollToElement,
} from './dom';
