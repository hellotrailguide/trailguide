# API Reference

## @trailguide/runtime

### Components

#### `<Trailguide>`

The main component that renders a trail.

```tsx
import { Trailguide } from '@trailguide/runtime';

<Trailguide
  trail={trailJson}
  onComplete={() => {}}
  onSkip={() => {}}
  onStepChange={(step, index) => {}}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `trail` | `Trail` | Yes | Trail object to render |
| `onComplete` | `() => void` | No | Called when all steps completed |
| `onSkip` | `() => void` | No | Called when user skips tour |
| `onStepChange` | `(step: Step, index: number) => void` | No | Called on each step change |

#### `<Spotlight>`

Renders the overlay with a cutout around the target element.

```tsx
import { Spotlight } from '@trailguide/runtime';

<Spotlight
  targetElement={element}
  padding={8}
/>
```

#### `<StepOverlay>`

Renders the tooltip for the current step.

```tsx
import { StepOverlay } from '@trailguide/runtime';

<StepOverlay
  step={currentStep}
  targetElement={element}
  currentIndex={0}
  totalSteps={5}
  onNext={() => {}}
  onPrev={() => {}}
  onSkip={() => {}}
/>
```

### Hooks

#### `useTrail(options)`

Hook for building custom tour UIs.

```tsx
import { useTrail } from '@trailguide/runtime';

const {
  currentStep,
  currentStepIndex,
  totalSteps,
  isActive,
  targetElement,
  next,
  prev,
  skip,
  goToStep,
  start,
  stop,
} = useTrail({
  trail,
  onComplete,
  onStepChange,
  onSkip,
});
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `currentStep` | `Step \| null` | Current step object |
| `currentStepIndex` | `number` | Zero-based index |
| `totalSteps` | `number` | Total number of steps |
| `isActive` | `boolean` | Whether tour is running |
| `targetElement` | `HTMLElement \| null` | Current target DOM element |
| `next` | `() => void` | Go to next step |
| `prev` | `() => void` | Go to previous step |
| `skip` | `() => void` | Skip the tour |
| `goToStep` | `(index: number) => void` | Jump to specific step |
| `start` | `() => void` | Start/restart tour |
| `stop` | `() => void` | Stop tour |

### Utilities

#### `findElement(selector)`

Safely query for an element.

```tsx
import { findElement } from '@trailguide/runtime';

const element = findElement('#my-element');
```

#### `isElementVisible(element)`

Check if an element is visible in the viewport.

```tsx
import { isElementVisible } from '@trailguide/runtime';

if (isElementVisible(element)) {
  // Element is visible
}
```

#### `scrollToElement(element)`

Smooth scroll to center an element in view.

```tsx
import { scrollToElement } from '@trailguide/runtime';

scrollToElement(element);
```

---

## @trailguide/recorder

### Hooks

#### `useRecorder(options)`

Hook for recording trails.

```tsx
import { useRecorder } from '@trailguide/recorder';

const recorder = useRecorder({
  trailId: 'my-trail',
  trailTitle: 'My Trail',
});
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trailId` | `string` | `'new-trail'` | ID for exported trail |
| `trailTitle` | `string` | `'New Trail'` | Title for exported trail |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `isRecording` | `boolean` | Recording mode active |
| `steps` | `Step[]` | Captured steps |
| `pendingStep` | `PendingStep \| null` | Element being configured |
| `startRecording` | `() => void` | Start recording |
| `stopRecording` | `() => void` | Stop recording |
| `toggleRecording` | `() => void` | Toggle recording |
| `addStep` | `(step) => void` | Add a step manually |
| `removeStep` | `(index) => void` | Remove step by index |
| `updateStep` | `(index, updates) => void` | Update step |
| `clearSteps` | `() => void` | Remove all steps |
| `confirmPendingStep` | `(details) => void` | Confirm pending step |
| `cancelPendingStep` | `() => void` | Cancel pending step |
| `exportTrail` | `() => Trail` | Get trail object |
| `downloadTrail` | `(filename?) => void` | Download as JSON |

### Components

#### `<RecorderOverlay>`

Pre-built recording UI.

```tsx
import { RecorderOverlay, useRecorder } from '@trailguide/recorder';

const recorder = useRecorder();

<RecorderOverlay recorder={recorder} />
```

#### `<StepForm>`

Form for configuring a captured step.

```tsx
import { StepForm } from '@trailguide/recorder';

<StepForm
  pendingStep={pendingStep}
  onConfirm={(details) => {}}
  onCancel={() => {}}
/>
```

### Utilities

#### `generateSelector(element)`

Generate a CSS selector for an element.

```tsx
import { generateSelector } from '@trailguide/recorder';

const selector = generateSelector(element);
// e.g., "#my-button" or "[data-testid='submit']"
```

#### `validateSelector(selector)`

Check if a selector matches an element.

```tsx
import { validateSelector } from '@trailguide/recorder';

if (validateSelector('#my-element')) {
  // Selector is valid
}
```
