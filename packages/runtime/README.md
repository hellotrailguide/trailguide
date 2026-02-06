# @trailguide/runtime

The runtime package for Trailguide. Renders interactive product tours from JSON trail files.

## Installation

```bash
pnpm add @trailguide/runtime
# or
npm install @trailguide/runtime
```

## Usage

```tsx
import { Trailguide } from '@trailguide/runtime';
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

Hook for custom tour UI.

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
} = useTrail({ trail, onComplete, onStepChange });
```

### Types

```typescript
interface Trail {
  id: string;
  title: string;
  version: string;
  steps: Step[];
}

interface Step {
  id: string;
  target: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  title: string;
  content: string;
  action?: 'click' | 'input' | 'hover' | 'none';
  nextOn?: 'click' | 'manual';
}
```

## Keyboard Navigation

- `→` or `Enter` - Next step
- `←` - Previous step
- `Escape` - Skip tour

## Styling

The runtime uses inline styles for zero-config setup. Components have class names for custom styling:

- `.trailguide-spotlight` - The overlay with cutout
- `.trailguide-step-overlay` - The tooltip container
