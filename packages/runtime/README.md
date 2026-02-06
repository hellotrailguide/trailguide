# @trailguide/runtime

React wrapper for Trailguide. Provides hooks and components for React apps.

> **Note:** For non-React apps, use `@trailguide/core` directly.

## Installation

```bash
npm install @trailguide/runtime @trailguide/core
```

## Usage

```tsx
import { useState } from 'react';
import { Trailguide } from '@trailguide/runtime';
import '@trailguide/core/dist/style.css';
import myTour from './tours/my-tour.json';

function App() {
  const [showTour, setShowTour] = useState(true);

  return (
    <>
      <YourApp />
      {showTour && (
        <Trailguide
          trail={myTour}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
          onStepChange={(step, index) => console.log(`Step ${index}:`, step)}
        />
      )}
    </>
  );
}
```

## API

### `<Trailguide>`

Main component that renders the tour.

| Prop | Type | Description |
|------|------|-------------|
| `trail` | `Trail` | The trail JSON object |
| `onComplete` | `() => void` | Called when user finishes all steps |
| `onSkip` | `() => void` | Called when user skips the tour |
| `onStepChange` | `(step, index) => void` | Called on each step change |

### `useTrail(options)`

Hook for programmatic control.

```tsx
import { useTrail } from '@trailguide/runtime';

const {
  currentStep,
  currentStepIndex,
  totalSteps,
  isActive,
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
  autoStart: false, // set true to start immediately
});
```

## Types

Types are re-exported from `@trailguide/core`:

```typescript
import type { Trail, Step, Placement } from '@trailguide/runtime';
```

## Keyboard Navigation

- `→` or `Enter` - Next step
- `←` - Previous step
- `Escape` - Skip tour

## Styling

Import styles from the core package:

```tsx
import '@trailguide/core/dist/style.css';
```

CSS classes available for customization:
- `.trailguide-overlay` - Main overlay container
- `.trailguide-spotlight` - The darkened backdrop
- `.trailguide-highlight` - Border around target element
- `.trailguide-tooltip` - The tooltip container
